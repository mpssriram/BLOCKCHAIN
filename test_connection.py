from database import db

try:
    with db.engine.connect() as connection:
        print("Database connected successfully!")
except Exception as e:
    print("Connection failed:", e)
