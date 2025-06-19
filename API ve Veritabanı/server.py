import os
import random
import uvicorn
from fastapi import FastAPI, HTTPException, responses, Request, UploadFile, Form
from fastapi.responses import FileResponse
from pymongo import MongoClient
from pydantic import BaseModel
from bson import ObjectId
from typing import Optional

app = FastAPI()
client = MongoClient("mongodb://localhost:27017")
db = client["mirror_app"]  
users_collection = db["users"]  

UPLOAD_DIRECTORY = "./uploads/"
if not os.path.exists(UPLOAD_DIRECTORY):
    os.makedirs(UPLOAD_DIRECTORY)

class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/login")
async def login(login_request: LoginRequest):
    user = users_collection.find_one({"username": login_request.username})
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
    if user["password"] != login_request.password:
        raise HTTPException(status_code=401, detail="Hatalı şifre.")
    return {"message": "Giriş başarılı", "username": login_request.username}

class User(BaseModel):
    username: str
    email: str
    password: str

@app.post("/signup")
async def signup(user: User):
    existing_user = users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Bu e-posta zaten kayıtlı.")
    user_dict = user.model_dump() 
    user_dict["profilePhoto"] = "default.jpg"
    user_dict["followers"] = []
    user_dict["following"] = []
    user_dict["posts"] = []
    result = users_collection.insert_one(user_dict)
    return {"message": "Kayıt başarılı", "user_id": str(result.inserted_id)}

class UsernameCheck(BaseModel):
    username: str

@app.post("/check-username")
async def check_username(data: UsernameCheck):
    username = data.username
    user = users_collection.find_one({"username": username})
    if user:
        return {"available": False}
    return {"available": True}

class EmailCheck(BaseModel):
    email: str

@app.post("/check-email")
async def check_email(data: EmailCheck):
    email = data.email
    user = users_collection.find_one({"email": email})
    if user:
        return {"available": False}
    return {"available": True}

class ResetPasswordRequest(BaseModel):
    email: str
    code: str
    new_password: str

class PasswdRecoveryRequest(BaseModel):
    email: str

@app.post("/send-reset-code")
async def send_reset_code(request: PasswdRecoveryRequest):
    user = users_collection.find_one({"email": request.email})
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
    verification_code = f"{random.randint(100000, 999999)}"
    users_collection.update_one(
        {"email": request.email},
        {"$set": {"latest_verification_code": verification_code}}
    )
    print("\033[33m " + f">> DOĞRULAMA KODU: {verification_code} >> {request.email}" + "\033[00m")
    return {"message": "Doğrulama kodu gönderildi."}

@app.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    user = users_collection.find_one({"email": request.email})
    if not user:
        raise HTTPException(status_code=404, detail="Bu e-posta adresi bulunamadı.")
    if user.get("latest_verification_code") != request.code:
        raise HTTPException(status_code=400, detail="Doğrulama kodu hatalı.")
    users_collection.update_one(
        {"email": request.email},
        {"$set": {"password": request.new_password, "latest_verification_code": None}}
    )
    return {"message": "Şifren başarıyla güncellendi."}

@app.post("/share")
async def share_post(
    username: str = Form(...),
    text: str = Form(...),
    type: str = Form(...),
    media: UploadFile = None):
    user = users_collection.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
    if media:
        file_extension = os.path.splitext(media.filename)[1]
        unique_filename = f"{ObjectId()}{file_extension}"
        file_path = os.path.join(UPLOAD_DIRECTORY, unique_filename)
        with open(file_path, "wb") as buffer:
            buffer.write(await media.read())
    else:
        raise HTTPException(status_code=400, detail="Medya dosyası eksik.")
    post_data = {
        "text": text,
        "mediaPath": unique_filename,
        "type" : type,
        "likes": [],
        "comments": [],
    }
    users_collection.update_one(
        {"username": username},
        {"$push": {"posts": post_data}}
    )

    return {"message": "Paylaşım başarıyla kaydedildi."}

@app.get("/profile/{username}")
async def get_profile(username: str):
    user = users_collection.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
    profile_data = {
        "profilePhoto": user.get("profilePhoto"),
        "followers": user.get("followers", []),
        "following": user.get("following", []),
        "posts": user.get("posts", []),
    }
    return profile_data

@app.get("/file/{file_path}")
async def serve_file(file_path: str):
    file_full_path = f"{UPLOAD_DIRECTORY}{file_path}"
    if not os.path.exists(file_full_path):
        raise HTTPException(status_code=404, detail="Dosya bulunamadı.")
    return FileResponse(file_full_path)

@app.post("/follow")
async def follow_user(data: dict):
    current_user = data["currentUser"]
    target_user = data["targetUser"]
    current = users_collection.find_one({"username": current_user})
    target = users_collection.find_one({"username": target_user})
    if not current or not target:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
    if target_user not in current["following"]:
        users_collection.update_one(
            {"username": current_user},
            {"$addToSet": {"following": target_user}}
        )
        users_collection.update_one(
            {"username": target_user},
            {"$addToSet": {"followers": current_user}}
        )
    current_updated = users_collection.find_one({"username": current_user})
    target_updated = users_collection.find_one({"username": target_user})
    return {
        "followingCount": len(current_updated["following"]),
    }

@app.get("/explore/videos")
async def get_explore_videos():
    all_posts = []
    for user in users_collection.find():
        posts = user.get("posts", [])
        for post in posts:
            post["username"] = user.get("username")
        all_posts.extend(posts)
    video_posts = [post for post in all_posts if post.get("type") == "video"]
    sorted_videos = sorted(video_posts, key=lambda x: len(x.get("likes", [])), reverse=True)
    return sorted_videos

@app.get("/feed/images/{startFrom}")
async def get_feed_images(startFrom: int):
    all_posts = []
    for user in users_collection.find():
        posts = user.get("posts", [])
        for post in posts:
            post["username"] = user.get("username")
        all_posts.extend(posts)
    image_posts = [post for post in all_posts if post.get("type") == "image"]
    sorted_images = sorted(image_posts, key=lambda x: len(x.get("likes", [])), reverse=True)
    if len(sorted_images[startFrom:-1]) >= 5:
        return sorted_images[startFrom:startFrom+5]
    else:
        return sorted_images[startFrom:]

@app.post("/like")
async def like_post(data: dict):
    username = data["username"]
    media_path = data["mediaPath"]
    user_with_post = users_collection.find_one({"posts.mediaPath": media_path})
    if not user_with_post:
        raise HTTPException(status_code=404, detail="Paylaşım bulunamadı.")
    posts = user_with_post["posts"]
    for post in posts:
        if post["mediaPath"] == media_path:
            if username in post["likes"]:
                post["likes"].remove(username)
            else:
                post["likes"].append(username)
            break
    users_collection.update_one(
        {"_id": user_with_post["_id"]},
        {"$set": {"posts": posts}}
    )
    return {"message": "Beğeni işlemi başarılı."}

class AddCommentRequest(BaseModel):
    mediaPath: str
    comment: list

@app.post("/add-comment")
async def add_comment(request: AddCommentRequest):
    user = users_collection.find_one({"posts.mediaPath": request.mediaPath})
    if not user:
        raise HTTPException(status_code=404, detail="Post bulunamadı.")
    result = users_collection.update_one(
        {"posts.mediaPath": request.mediaPath},
        {"$push": {"posts.$.comments": request.comment}},
    )
    if result.modified_count == 1:
        return {"message": "Yorum başarıyla eklendi."}
    else:
        raise HTTPException(status_code=500, detail="Yorum eklenemedi.")

def launch():
    uvicorn.run("server:app", host="", port=8000, log_level="info", )

if __name__ == "__main__":
    launch()