from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from fastapi import HTTPException
from config import settings


class Database:
    def __init__(self):
        self.Base = declarative_base()
        self.engine = None
        self.SessionLocal = None

        if settings.DATABASE_URL:
            self.engine = create_engine(
                settings.DATABASE_URL,
                pool_pre_ping=True
            )
            self.SessionLocal = sessionmaker(
                autocommit=False,
                autoflush=False,
                bind=self.engine
            )

    @property
    def is_configured(self) -> bool:
        return self.engine is not None and self.SessionLocal is not None

    def get_db(self):
        if not self.is_configured:
            raise HTTPException(
                status_code=503,
                detail="Database is not configured for this deployment."
            )

        db = self.SessionLocal()
        try:
            yield db
        finally:
            db.close()

    def create_tables(self):
        if not self.is_configured:
            return
        self.Base.metadata.create_all(bind=self.engine)


db = Database()
