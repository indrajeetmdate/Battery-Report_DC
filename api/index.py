from fastapi import FastAPI, HTTPException, Response
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
import io
import os
import urllib.request
import json
from pydantic import BaseModel

class BookingNotification(BaseModel):
    customer_name: str
    phone_number: str
    location_data: str
    checkup_date: str
    time_slot: str

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
    
    # Escape some possible markdown issues or just use standard blocks
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
