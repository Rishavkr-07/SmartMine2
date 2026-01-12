from flask import Flask, jsonify, request
from flask_cors import CORS
from models import db, Equipment, Maintenance
from datetime import datetime

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///smartmine.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)
CORS(app, resources={r"/api/*": {"origins": "*"}})

@app.route("/")
def home():
    return "SmartMine backend is running"

@app.route("/api/equipment", methods=["GET"])
def get_equipment():
    equipment_list = Equipment.query.all()
    result = []
    for eq in equipment_list:
        result.append({
            "id": eq.id,
            "code": eq.code,
            "name": eq.name,
            "type": eq.type,
            "usage_hours": eq.usage_hours,
            "maintenance_limit": eq.maintenance_limit,
            "status": eq.calculate_status()
        })
    return jsonify(result)

@app.route("/api/equipment", methods=["POST"])
def add_equipment():
    data = request.json
    new_equipment = Equipment(
        name=data["name"],
        code=data["code"],
        type=data["type"],
        usage_hours=data.get("usage_hours", 0),
        maintenance_limit=data["maintenance_limit"]
    )
    db.session.add(new_equipment)
    db.session.commit()
    return jsonify({"message": "Equipment added successfully", "id": new_equipment.id}), 201

@app.route("/api/equipment/<int:equipment_id>", methods=["PUT"])
def update_equipment(equipment_id):
    data = request.json
    equipment = Equipment.query.get(equipment_id)
    if not equipment:
        return jsonify({"error": "Equipment not found"}), 404

    equipment.name = data.get("name", equipment.name)
    equipment.code = data.get("code", equipment.code)
    equipment.type = data.get("type", equipment.type)
    equipment.usage_hours = data.get("usage_hours", equipment.usage_hours)
    equipment.maintenance_limit = data.get("maintenance_limit", equipment.maintenance_limit)
    db.session.commit()
    return jsonify({"message": "Equipment updated successfully"})

@app.route("/api/equipment/<int:equipment_id>", methods=["DELETE"])
def delete_equipment(equipment_id):
    equipment = Equipment.query.get(equipment_id)
    if not equipment:
        return jsonify({"error": "Equipment not found"}), 404
    db.session.delete(equipment)
    db.session.commit()
    return jsonify({"message": "Equipment deleted successfully"})

@app.route("/api/equipment/<int:equipment_id>/update-hours", methods=["POST"])
def update_equipment_hours(equipment_id):
    data = request.json
    equipment = Equipment.query.get(equipment_id)
    if not equipment:
        return jsonify({"error": "Equipment not found"}), 404
    equipment.usage_hours = data.get("usage_hours", equipment.usage_hours)
    db.session.commit()
    return jsonify({
        "message": "Hours updated",
        "equipment": {
            "id": equipment.id,
            "code": equipment.code,
            "name": equipment.name,
            "usage_hours": equipment.usage_hours,
            "status": equipment.calculate_status()
        }
    })

@app.route("/api/alerts", methods=["GET"])
def get_alerts():
    equipment_list = Equipment.query.all()
    alerts = []
    for eq in equipment_list:
        status = eq.calculate_status()
        if status in ["Warning", "Critical"]:
            alerts.append({
                "equipment_id": eq.id,
                "code": eq.code,
                "name": eq.name,
                "status": status,
                "usage_hours": eq.usage_hours,
                "maintenance_limit": eq.maintenance_limit
            })
    return jsonify(alerts)

@app.route("/api/maintenance", methods=["GET"])
def get_maintenance():
    maintenance_list = Maintenance.query.all()
    result = []
    for m in maintenance_list:
        result.append({
            "id": m.id,
            "equipment_id": m.equipment_id,
            "equipment_name": m.equipment.name if m.equipment else "Unknown",
            "service_date": m.service_date,
            "maintenance_type": m.maintenance_type,
            "technician": m.technician,
            "description": m.description,
            "usage_at_service": m.usage_at_service
        })
    return jsonify(result)

@app.route("/api/maintenance", methods=["POST"])
def add_maintenance():
    data = request.json
    new_maintenance = Maintenance(
        equipment_id=data["equipment_id"],
        service_date=data["service_date"],
        maintenance_type=data["maintenance_type"],
        technician=data["technician"],
        description=data["description"],
        usage_at_service=data["usage_at_service"]
    )
    db.session.add(new_maintenance)
    db.session.commit()
    return jsonify({"message": "Maintenance record added", "id": new_maintenance.id}), 201

@app.route("/api/dashboard-summary", methods=["GET"])
def dashboard_summary():
    equipment_list = Equipment.query.all()
    summary = {
        "total": len(equipment_list),
        "good": 0,
        "warning": 0,
        "critical": 0
    }
    for eq in equipment_list:
        status = eq.calculate_status()
        if status == "Good":
            summary["good"] += 1
        elif status == "Warning":
            summary["warning"] += 1
        elif status == "Critical":
            summary["critical"] += 1
    return jsonify(summary)

@app.route("/api/seed", methods=["POST"])
def seed_data():
    if Equipment.query.count() > 0:
        return jsonify({"message": "Data already exists"}), 400

    sample_equipment = [
        Equipment(code="ATL-ST18-005", name="Atlas Copco ST18", type="Scooptram", usage_hours=3400, maintenance_limit=4000),
        Equipment(code="BEL-B60E-008", name="Bell B60E", type="Articulated Truck", usage_hours=6100, maintenance_limit=5000),
        Equipment(code="CAT-797F-001", name="Caterpillar 797F", type="Haul Truck", usage_hours=4200, maintenance_limit=5000),
        Equipment(code="EPI-BM2-006", name="Epiroc Boomer M2", type="Face Drill", usage_hours=2900, maintenance_limit=3000),
        Equipment(code="HIT-EX8000-007", name="Hitachi EX8000", type="Excavator", usage_hours=1800, maintenance_limit=2500),
        Equipment(code="KOM-PC8000-002", name="Komatsu PC8000", type="Excavator", usage_hours=4850, maintenance_limit=5000),
        Equipment(code="LIE-T284-003", name="Liebherr T 284", type="Haul Truck", usage_hours=5200, maintenance_limit=5000),
        Equipment(code="SAN-DD422-004", name="Sandvik DD422i", type="Drill Jumbo", usage_hours=2100, maintenance_limit=3000),
    ]
    db.session.add_all(sample_equipment)
    db.session.flush()

    sample_maintenance = [
        Maintenance(equipment_id=2, service_date="2024-03-15", maintenance_type="Engine Overhaul", 
                   technician="John Smith", description="Complete engine teardown and rebuild", usage_at_service=5500),
        Maintenance(equipment_id=3, service_date="2024-03-10", maintenance_type="Brake Inspection", 
                   technician="Maria Garcia", description="Brake system check and pad replacement", usage_at_service=4000),
        Maintenance(equipment_id=1, service_date="2024-03-05", maintenance_type="Hydraulic Service", 
                   technician="Robert Chen", description="Hydraulic fluid change and hose inspection", usage_at_service=3200),
    ]
    db.session.add_all(sample_maintenance)
    db.session.commit()
    return jsonify({"message": "Sample equipment and maintenance inserted"}), 201

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(host="127.0.0.1", port=5000, debug=True)