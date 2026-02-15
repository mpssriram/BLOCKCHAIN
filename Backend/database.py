from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from config import settings


class Database:
    def __init__(self):
        # Enable foreign keys for SQLite
        connect_args = {}
        if settings.DATABASE_URL.startswith('sqlite'):
            connect_args = {'check_same_thread': False}
        
        self.engine = create_engine(
            settings.DATABASE_URL,
            pool_pre_ping=True,
            connect_args=connect_args
        )
        
        # Enable foreign keys for SQLite
        if settings.DATABASE_URL.startswith('sqlite'):
            from sqlalchemy import event
            @event.listens_for(self.engine, "connect")
            def set_sqlite_pragma(dbapi_conn, connection_record):
                cursor = dbapi_conn.cursor()
                cursor.execute("PRAGMA foreign_keys=ON")
                cursor.close()
        self.SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=self.engine
        )
        self.Base = declarative_base()

    def get_db(self):
        db = self.SessionLocal()
        try:
            yield db
        finally:
            db.close()

    def create_tables(self):
        self.Base.metadata.create_all(bind=self.engine)


db = Database()
