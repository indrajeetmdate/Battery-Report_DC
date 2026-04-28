from fastapi import FastAPI, HTTPException, Response
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
import io
import os
import urllib.request
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pydantic import BaseModel

class BookingNotification(BaseModel):
    customer_name: str
    phone_number: str
    location_data: str
    checkup_date: str
    time_slot: str

class PartnerNotification(BaseModel):
    partner_name: str
    phone_number: str

app = FastAPI()

# The public folder ID provided
FOLDER_ID = '1rtAgG3tsUk8KdiIzDSE2hZSCBrqOM_-4'
# API Key should be set in Vercel Environment Variables
API_KEY = os.environ.get("GOOGLE_API_KEY")

@app.get("/api/check-pdf")
def check_pdf(serialNumber: str):
    if not API_KEY:
        raise HTTPException(status_code=500, detail="Server misconfiguration: API Key missing")

    try:
        service = build('drive', 'v3', developerKey=API_KEY)
        
        # We use 'contains' to ensure we match even if named 'SERIAL.pdf' or 'Report_SERIAL.pdf'
        # but also filter by application/pdf MIME type
        query = f"'{FOLDER_ID}' in parents and name contains '{serialNumber}' and mimeType = 'application/pdf' and trashed = false"
        
        results = service.files().list(
            q=query, 
            pageSize=1, 
            fields="files(id, name, webViewLink)"
        ).execute()
        
        files = results.get('files', [])

        if files:
            return {"exists": True, "webViewLink": files[0]['webViewLink'], "name": files[0]['name']}
        
        return {"exists": False}

    except Exception as e:
        print(f"Error checking PDF in Drive: {str(e)}")
        return {"exists": False, "error": str(e)}

@app.get("/api/fetch-report")
def fetch_report(productId: str):
    if not API_KEY:
        # Fallback for demo purposes if no key is present, though this won't work for real Drive calls
        print("Warning: GOOGLE_API_KEY is not set.")
        raise HTTPException(status_code=500, detail="Server misconfiguration: API Key missing")

    try:
        # 1. Setup Drive Service
        service = build('drive', 'v3', developerKey=API_KEY)

        # 2. Search for the file
        # We look for a file whose name contains the productId inside the specific folder
        query = f"'{FOLDER_ID}' in parents and name contains '{productId}' and trashed = false"
        results = service.files().list(
            q=query, 
            pageSize=1, 
            fields="files(id, name)"
        ).execute()
        
        files = results.get('files', [])

        if not files:
            raise HTTPException(status_code=404, detail="Product ID not found in database")

        file_id = files[0]['id']
        file_name = files[0]['name']

        # 3. Download the file
        request = service.files().get_media(fileId=file_id)
        file_stream = io.BytesIO()
        downloader = MediaIoBaseDownload(file_stream, request)
        
        done = False
        while done is False:
            status, done = downloader.next_chunk()

        # 4. Return file content
        file_stream.seek(0)
        return Response(
            content=file_stream.read(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={file_name}"}
        )

    except Exception as e:
        print(f"Error fetching from Drive: {str(e)}")
        # If it's our own 404, re-raise it
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to retrieve report: {str(e)}")

@app.post("/api/notify-slack")
def notify_slack(booking: BookingNotification):
    webhook_url = os.environ.get("SLACK_WEBHOOK_URL")
    
    if not webhook_url:
        print("Warning: SLACK_WEBHOOK_URL is not set.")
        raise HTTPException(status_code=500, detail="Slack webhook disabled")
    
    message = {
        "text": f"🟢 *New Free Checkup Booking!*\n*Name:* {booking.customer_name}\n*Phone:* {booking.phone_number}\n*Date:* {booking.checkup_date}\n*Time Slot:* {booking.time_slot}\n*Location:* {booking.location_data}"
    }
    
    req = urllib.request.Request(webhook_url, data=json.dumps(message).encode('utf-8'), headers={'Content-Type': 'application/json'})
    
    try:
        with urllib.request.urlopen(req) as response:
            if response.getcode() == 200:
                return {"status": "success"}
            else:
                raise HTTPException(status_code=500, detail="Failed to send Slack notification")
    except Exception as e:
        print(f"Slack webhook error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to notify Slack: {str(e)}")

@app.post("/api/notify-partner-slack")
def notify_partner_slack(partner: PartnerNotification):
    webhook_url = os.environ.get("SLACK_PARTNERS_WEBHOOK_URL")
    
    if not webhook_url:
        print("Warning: SLACK_PARTNERS_WEBHOOK_URL is not set.")
        raise HTTPException(status_code=500, detail="Slack partners webhook disabled")
    
    message = {
        "text": f"🤝 *New Partner Registration!*\n*Business Details:* {partner.partner_name}\n*Phone Contact:* {partner.phone_number}\n_Please review the admin dashboard for partner verification._"
    }
    
    req = urllib.request.Request(webhook_url, data=json.dumps(message).encode('utf-8'), headers={'Content-Type': 'application/json'})
    
    try:
        with urllib.request.urlopen(req) as response:
            if response.getcode() == 200:
                return {"status": "success"}
            else:
                raise HTTPException(status_code=500, detail="Failed to send Slack notification")
    except Exception as e:
        print(f"Slack webhook error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to notify Slack: {str(e)}")

class WarrantyEmail(BaseModel):
    customer_name: str
    customer_email: str

@app.post("/api/send-warranty-email")
def send_warranty_email(data: WarrantyEmail):
    gmail_user = "datlioncnergy@gmail.com"
    gmail_password = os.environ.get("GMAIL_APP_PASSWORD")

    if not gmail_password:
        print("Warning: GMAIL_APP_PASSWORD is not set.")
        raise HTTPException(status_code=500, detail="Email service not configured")

    html_body = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: #1A1C19; padding: 32px 24px; text-align: center;">
        <h1 style="color: #78AD3E; margin: 0; font-size: 28px; letter-spacing: 2px;">DC ENERGY</h1>
        <p style="color: #ffffff; margin: 8px 0 0; font-size: 12px; letter-spacing: 4px; text-transform: uppercase;">Warranty Confirmation</p>
      </div>
      <div style="padding: 32px 24px;">
        <p style="color: #1A1C19; font-size: 16px; margin: 0 0 16px;">Dear <strong>{data.customer_name}</strong>,</p>
        <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          Thank you for registering your DC Energy product! Your warranty has been successfully recorded in our system.
        </p>
        <div style="background: #f0fbe4; border: 2px solid #78AD3E; border-radius: 16px; padding: 20px; margin: 0 0 24px;">
          <p style="color: #1A1C19; font-weight: bold; margin: 0 0 8px; font-size: 14px;">📄 IMPORTANT</p>
          <p style="color: #555; font-size: 14px; line-height: 1.5; margin: 0;">
            Please keep your <strong>purchase invoice</strong> safe. It serves as your official proof of warranty for any future service or claim.
          </p>
        </div>
        <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
          If you have any questions or need support, feel free to reach out to us at <a href="mailto:datlioncnergy@gmail.com" style="color: #78AD3E; font-weight: bold;">datlioncnergy@gmail.com</a>.
        </p>
        <p style="color: #1A1C19; font-size: 14px; margin: 0;">
          Warm regards,<br/><strong>DC Energy Team</strong>
        </p>
      </div>
      <div style="background: #f5f5f5; padding: 16px 24px; text-align: center; border-top: 1px solid #e0e0e0;">
        <p style="color: #999; font-size: 11px; margin: 0;">© 2025 DC Energy. All rights reserved.</p>
      </div>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "DC Energy — Warranty Registration Confirmed ✅"
    msg["From"] = gmail_user
    msg["To"] = data.customer_email
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(gmail_user, gmail_password)
            server.sendmail(gmail_user, data.customer_email, msg.as_string())
        return {"status": "success"}
    except Exception as e:
        print(f"Email send error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send confirmation email: {str(e)}")
