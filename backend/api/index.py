from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

app = FastAPI()

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logo path
BASE_DIR = Path(__file__).resolve().parent.parent
LOGO_PATH = BASE_DIR / "assets" / "logo.png"

# Premium Gold/Charcoal HTML Styles for 22nd Avenue
EMAIL_STYLES = """
<style>
    body { font-family: 'Playfair Display', 'Didot', 'Segoe UI', serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #fafafa; }
    .container { max-width: 600px; margin: 30px auto; padding: 30px; border: 1px solid #e5e5e5; border-radius: 4px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 1px solid #eaeaea; }
    .logo { width: 160px; height: auto; display: block; margin: 0 auto; }
    .content { margin-bottom: 40px; }
    .title { font-size: 22px; color: #111; font-weight: 300; letter-spacing: 1px; margin-bottom: 25px; text-transform: uppercase; text-align: center; }
    .footer { font-size: 12px; color: #999; border-top: 1px solid #eaeaea; padding-top: 25px; text-align: center; letter-spacing: 1px; text-transform: uppercase; }
    .highlight { color: #c5a880; font-weight: bold; }
    .details-table { width: 100%; border-collapse: collapse; margin-top: 25px; }
    .details-table td { padding: 14px 0; border-bottom: 1px solid #f0f0f0; font-size: 15px; }
    .label { font-weight: bold; color: #666; width: 35%; text-transform: uppercase; font-size: 13px; letter-spacing: 0.5px; }
    .message-box { background-color: #fcfcfc; border-left: 2px solid #c5a880; padding: 15px 20px; margin-top: 15px; font-style: italic; color: #444; }
</style>
"""

def send_smtp_emails(messages: list, host: str, port: int, user: str, password: str):
    """Internal helper to send emails via SMTP."""
    with smtplib.SMTP(host, port) as server:
        if port == 587:
            server.starttls()
        server.login(user, password)
        for msg in messages:
            server.send_message(msg)

@app.post("/api/apply")
async def apply(
    name: str = Form(...),
    email: str = Form(...),
    position: str = Form(...),
    note: str = Form(default=""),
    attachment: UploadFile = File(None)
):
    try:
        # Validate required fields
        if not name or not email or not position:
            raise HTTPException(status_code=400, detail="Missing required fields")

        # Determine type of submission
        is_business = "Business" in position
        is_artist = "Artist" in position
        is_career = "Career" in position or "Careers" in position

        # Email credentials
        email_user = os.getenv("EMAIL_USER") or "experiences@22ndavenue.co.in"
        email_pass = os.getenv("EMAIL_PASS")
        email_host = os.getenv("EMAIL_HOST", "smtp.gmail.com")
        email_port = int(os.getenv("EMAIL_PORT", 587))

        # Destination routing (all go to experiences@22ndavenue.co.in by default)
        destination_email = os.getenv("DESTINATION_EMAIL") or email_user

        if is_business:
            subject_prefix = "New Business Enquiry"
        elif is_artist:
            subject_prefix = "New Artist Profile Submission"
        else:  # Careers / Default
            subject_prefix = "New Career Application"

        # If credentials are not configured, fallback to log mode for development testing
        if not email_user or not email_pass:
            print(f"[TEST MODE] Submission received:")
            print(f"Name: {name}, Email: {email}, Type: {position}, Message: {note}")
            if attachment:
                print(f"Attachment: {attachment.filename}")
            return {"success": True, "message": "Submission received successfully (SMTP credentials missing)"}

        # --- 1. ADMIN/HR EMAIL (Notification) ---
        admin_msg = MIMEMultipart()
        admin_msg["From"] = f'"22nd Avenue Portal" <{email_user}>'
        admin_msg["To"] = destination_email
        admin_msg["Subject"] = f"{subject_prefix} | {name}"

        # Parse message content
        message_content = note
        portfolio_section = ""
        
        # If artist, portfolio link might be extracted/formatted in note
        if is_artist and "Portfolio/Social:" in note:
            parts = note.split("\n\nMessage:\n")
            portfolio_link = parts[0].replace("Portfolio/Social: ", "").strip()
            message_content = parts[1] if len(parts) > 1 else ""
            portfolio_section = f'<tr><td class="label">Portfolio/Social:</td><td><a href="{portfolio_link}" class="highlight">{portfolio_link}</a></td></tr>'

        admin_html = f"""
        <html>
            <head>{EMAIL_STYLES}</head>
            <body>
                <div class="container">
                    <div class="header">
                        <img src="cid:22ndlogo" class="logo" alt="22nd Avenue Logo" />
                    </div>
                    <div class="content">
                        <h2 class="title">{subject_prefix}</h2>
                        <table class="details-table">
                            <tr><td class="label">Name:</td><td>{name}</td></tr>
                            <tr><td class="label">Email:</td><td><a href="mailto:{email}">{email}</a></td></tr>
                            <tr><td class="label">Category:</td><td class="highlight">{position}</td></tr>
                            {portfolio_section}
                        </table>
                        <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 30px; color: #666;">Message:</h3>
                        <div class="message-box">
                            {message_content.replace('\n', '<br/>')}
                        </div>
                    </div>
                    <div class="footer">
                        <p>&copy; 2026 22nd Avenue. All rights reserved.</p>
                    </div>
                </div>
            </body>
        </html>
        """
        admin_msg.attach(MIMEText(admin_html, "html"))

        # --- 2. USER EMAIL (Confirmation) ---
        user_msg = MIMEMultipart()
        user_msg["From"] = f'"22nd Avenue" <{email_user}>'
        user_msg["To"] = email
        user_msg["Subject"] = f"Thank you for contacting 22nd Avenue, {name.split(' ')[0]}!"

        if is_business:
            ack_message = "Thank you for reaching out to us. We acknowledge receipt of your query and are currently reviewing the details. We appreciate your patience and will get back to you with an update as soon as possible."
        elif is_artist:
            ack_message = "Thank you for reaching out to us. We acknowledge receipt of your query and are currently reviewing the details. We appreciate your patience and will get back to you with an update as soon as possible."
        else:  # Career
            ack_message = f"Thank you for reaching out to us. We acknowledge receipt of your query and are currently reviewing the details. We appreciate your patience and will get back to you with an update as soon as possible."

        user_html = f"""
        <html>
            <head>{EMAIL_STYLES}</head>
            <body>
                <div class="container">
                    <div class="header">
                        <img src="cid:22ndlogo" class="logo" alt="22nd Avenue Logo" />
                    </div>
                    <div class="content">
                        <p>Dear <span class="highlight">{name.split(' ')[0]}</span>,</p>
                        <p>{ack_message}</p>
                        <p>Best Regards,<br/><strong>Team 22nd Avenue</strong></p>
                    </div>
                    <div class="footer">
                        <p>&copy; 2026 22nd Avenue. All rights reserved.</p>
                    </div>
                </div>
            </body>
        </html>
        """
        user_msg.attach(MIMEText(user_html, "html"))

        # Attach logo inline if it exists
        if LOGO_PATH.exists():
            with open(LOGO_PATH, "rb") as f:
                logo_data = f.read()
                
            for msg in [admin_msg, user_msg]:
                logo_part = MIMEApplication(logo_data, Name="logo.png")
                logo_part.add_header("Content-ID", "<22ndlogo>")
                logo_part.add_header("Content-Disposition", "inline", filename="logo.png")
                logo_part.add_header("Content-Type", "image/png")
                msg.attach(logo_part)

        # Attach CV/Resume to Admin Email if present
        if attachment and is_career:
            file_content = await attachment.read()
            cv_part = MIMEApplication(file_content, Name=attachment.filename)
            cv_part.add_header("Content-Disposition", f'attachment; filename="{attachment.filename}"')
            admin_msg.attach(cv_part)

        # Send emails synchronously
        send_smtp_emails(
            [admin_msg, user_msg], 
            email_host, 
            email_port, 
            email_user, 
            email_pass
        )

        return {"success": True, "message": "Submission processed successfully!"}

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(
            status_code=500,
            detail={"error": "Failed to process submission", "debug": str(e)}
        )

@app.get("/")
def read_root():
    import os
    return {
        "status": "22nd Avenue API is online",
        "email_pass": os.getenv("EMAIL_PASS", "Not found")
    }
