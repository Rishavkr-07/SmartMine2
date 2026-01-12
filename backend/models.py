from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Equipment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    usage_hours = db.Column(db.Integer, default=0)
    maintenance_limit = db.Column(db.Integer, nullable=False)

    def calculate_status(self):
        ratio = self.usage_hours / self.maintenance_limit
        if ratio >= 1:
            return "Critical"
        elif ratio >= 0.75:
            return "Warning"
        else:
            return "Good"

    def __repr__(self):
        return f"<Equipment {self.code}>"

class Maintenance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    equipment_id = db.Column(db.Integer, db.ForeignKey('equipment.id'), nullable=False)
    service_date = db.Column(db.String(10), nullable=False)
    maintenance_type = db.Column(db.String(100), nullable=False)
    technician = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    usage_at_service = db.Column(db.Integer, nullable=False)
    equipment = db.relationship('Equipment', backref=db.backref('maintenances', lazy=True))

    def __repr__(self):
        return f"<Maintenance {self.id} for Equipment {self.equipment_id}>"