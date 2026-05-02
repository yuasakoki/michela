"""Flask Blueprintルート定義"""
from .auth_routes import auth_bp
from .customer_routes import customer_bp
from .weight_routes import weight_bp
from .ai_routes import ai_bp
from .research_routes import research_bp
from .training_routes import training_bp
from .meal_routes import meal_bp
from .backup_routes import backup_bp

__all__ = [
    'auth_bp',
    'customer_bp',
    'weight_bp',
    'ai_bp',
    'research_bp',
    'training_bp',
    'meal_bp',
    'backup_bp',
]
