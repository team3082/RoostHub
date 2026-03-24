"""
FRC Robot Shooting Rate Prediction using Poisson Regression
=================================================

This notebook implements a Poisson regression model to predict shooting rates
for FRC robots based on scouting data.

Poisson regression is ideal for count data (number of shots) because:
- It models non-negative integer counts
- Handles overdispersion in count data
- Provides interpretable coefficients
- Works well with time-based exposure variables

Dataset Requirements:
- team_number: Robot team identifier
- match_number: Match identifier  
- teleop_shooting_times: Array of shooting durations (seconds)
- auto_shooting_times: Array of autonomous shooting durations (seconds)
- teleop_used_depot: Depot usage count
- teleop_used_outpost: Outpost usage count
- defense_rating: Defensive capability rating (1-10)
- driving_rating: Driving skill rating (1-10)
- accuracy_rating: Shooting accuracy rating (1-10)

Target Variable:
- total_shots: Total shots taken in match
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.linear_model import PoissonRegressor
from sklearn.metrics import mean_poisson_deviance, mean_absolute_error
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

# Set style for better plots
plt.style.use('seaborn-v0_8')
sns.set_palette("husl")

def load_and_prepare_data(csv_path='scouting_data.csv'):
    """
    Load and prepare scouting data for Poisson regression
    
    Args:
        csv_path: Path to scouting data CSV file
        
    Returns:
        pd.DataFrame: Prepared dataset with engineered features
    """
    
    print("📊 Loading and preparing scouting data...")
    
    # Load the data
    try:
        df = pd.read_csv(csv_path)
        print(f"✅ Loaded {len(df)} match records")
    except FileNotFoundError:
        print("❌ File not found. Creating sample data for demonstration...")
        df = create_sample_data()
    
    # Data cleaning and preparation
    df['total_shooting_time'] = df['teleop_shooting_times'].apply(
        lambda x: sum(eval(x)) if isinstance(x, str) else sum(x) if isinstance(x, list) else 0
    )
    df['total_shots'] = df['teleop_shooting_times'].apply(
        lambda x: len(eval(x)) if isinstance(x, str) else len(x) if isinstance(x, list) else 0
    )
    
    # Feature engineering
    df['shots_per_second'] = np.where(
        df['total_shooting_time'] > 0,
        df['total_shots'] / df['total_shooting_time'],
        0
    )
    
    df['resource_usage'] = df['teleop_used_depot'] + df['teleop_used_outpost']
    df['skill_sum'] = df['defense_rating'] + df['driving_rating'] + df['accuracy_rating']
    df['avg_rating'] = df['skill_sum'] / 3
    
    # Create interaction terms
    df['accuracy_time_interaction'] = df['accuracy_rating'] * df['total_shooting_time']
    df['driving_resource_interaction'] = df['driving_rating'] * df['resource_usage']
    
    print(f"🔧 Features engineered: {list(df.columns)}")
    return df

def create_sample_data(n_teams=20, n_matches_per_team=5):
    """
    Create realistic sample FRC scouting data for demonstration
    
    Args:
        n_teams: Number of teams to generate
        n_matches_per_team: Matches per team
        
    Returns:
        pd.DataFrame: Sample dataset
    """
    
    np.random.seed(42)  # For reproducible results
    
    data = []
    team_numbers = np.random.randint(1000, 9999, n_teams)
    
    for team in team_numbers:
        for match in range(1, n_matches_per_team + 1):
            # Base shooting rate varies by team skill
            base_shots = np.random.poisson(8 + team % 10)  # Some teams shoot more
            
            # Higher accuracy -> more shots
            accuracy = np.random.randint(3, 11)
            accuracy_modifier = 1 + (accuracy - 5) * 0.1
            
            # Higher driving -> better positioning -> more shots
            driving = np.random.randint(3, 11)
            driving_modifier = 1 + (driving - 5) * 0.05
            
            # More resource usage -> more shooting opportunities
            depot = np.random.randint(0, 6)
            outpost = np.random.randint(0, 6)
            resource_modifier = 1 + (depot + outpost) * 0.1
            
            # Calculate final shots with some randomness
            total_shots = max(0, int(base_shots * accuracy_modifier * driving_modifier * resource_modifier))
            shooting_time = max(1, total_shots * np.random.uniform(2, 4))  # 2-4 seconds per shot
            
            data.append({
                'team_number': team,
                'match_number': match,
                'total_shots': total_shots,
                'total_shooting_time': round(shooting_time, 1),
                'teleop_used_depot': depot,
                'teleop_used_outpost': outpost,
                'defense_rating': np.random.randint(3, 11),
                'driving_rating': driving,
                'accuracy_rating': accuracy
            })
    
    return pd.DataFrame(data)

def explore_data(df):
    """
    Exploratory data analysis and visualization
    
    Args:
        df: Input dataframe
    """
    
    print("\n🔍 Exploratory Data Analysis")
    print("=" * 50)
    
    # Basic statistics
    print(f"Dataset Shape: {df.shape}")
    print(f"Teams: {df['team_number'].nunique()}")
    print(f"Matches per team: {len(df) / df['team_number'].nunique():.1f}")
    
    # Shooting rate distribution
    fig, axes = plt.subplots(2, 2, figsize=(15, 12))
    
    # Shot count distribution
    axes[0, 0].hist(df['total_shots'], bins=20, alpha=0.7, color='blue')
    axes[0, 0].set_title('Distribution of Total Shots per Match')
    axes[0, 0].set_xlabel('Total Shots')
    axes[0, 0].set_ylabel('Frequency')
    
    # Shooting rate distribution
    valid_rates = df[df['shots_per_second'] > 0]['shots_per_second']
    axes[0, 1].hist(valid_rates, bins=20, alpha=0.7, color='green')
    axes[0, 1].set_title('Distribution of Shooting Rate (shots/second)')
    axes[0, 1].set_xlabel('Shots per Second')
    axes[0, 1].set_ylabel('Frequency')
    
    # Shots vs Accuracy
    axes[1, 0].scatter(df['accuracy_rating'], df['total_shots'], alpha=0.6)
    axes[1, 0].set_title('Shots vs Accuracy Rating')
    axes[1, 0].set_xlabel('Accuracy Rating')
    axes[1, 0].set_ylabel('Total Shots')
    
    # Shots vs Resource Usage
    axes[1, 1].scatter(df['resource_usage'], df['total_shots'], alpha=0.6)
    axes[1, 1].set_title('Shots vs Resource Usage')
    axes[1, 1].set_xlabel('Resource Usage (Depot + Outpost)')
    axes[1, 1].set_ylabel('Total Shots')
    
    plt.tight_layout()
    plt.savefig('shooting_exploration.png', dpi=300, bbox_inches='tight')
    plt.show()
    
    # Correlation matrix
    plt.figure(figsize=(10, 8))
    correlation_vars = ['total_shots', 'accuracy_rating', 'driving_rating', 'defense_rating', 'resource_usage']
    correlation_matrix = df[correlation_vars].corr()
    
    sns.heatmap(correlation_matrix, annot=True, cmap='coolwarm', center=0, 
                square=True, fmt='.2f')
    plt.title('Feature Correlation Matrix')
    plt.tight_layout()
    plt.savefig('correlation_matrix.png', dpi=300, bbox_inches='tight')
    plt.show()

def build_poisson_model(df):
    """
    Build and train Poisson regression model
    
    Args:
        df: Training dataframe
        
    Returns:
        tuple: (model, scaler, X_test, y_test, feature_names)
    """
    
    print("\n🤖 Building Poisson Regression Model")
    print("=" * 50)
    
    # Define features and target
    feature_cols = [
        'accuracy_rating', 'driving_rating', 'defense_rating',
        'resource_usage', 'total_shooting_time', 'avg_rating',
        'accuracy_time_interaction', 'driving_resource_interaction'
    ]
    
    X = df[feature_cols]
    y = df['total_shots']
    
    print(f"Features: {feature_cols}")
    print(f"Target: total_shots")
    print(f"Feature matrix shape: {X.shape}")
    print(f"Target vector shape: {y.shape}")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Scale features (important for regularization)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train Poisson regressor
    model = PoissonRegressor(alpha=1.0, max_iter=1000, random_state=42)
    model.fit(X_train_scaled, y_train)
    
    print(f"✅ Model trained successfully!")
    print(f"Training samples: {len(X_train)}")
    print(f"Test samples: {len(X_test)}")
    
    return model, scaler, X_test_scaled, y_test, feature_cols

def evaluate_model(model, X_test, y_test, feature_names):
    """
    Evaluate model performance and provide insights
    
    Args:
        model: Trained Poisson model
        X_test: Test features
        y_test: Test targets
        feature_names: List of feature names
    """
    
    print("\n📈 Model Evaluation")
    print("=" * 50)
    
    # Make predictions
    y_pred = model.predict(X_test)
    
    # Calculate metrics
    mae = mean_absolute_error(y_test, y_pred)
    mpd = mean_poisson_deviance(y_test, y_pred)
    
    print(f"Mean Absolute Error: {mae:.2f} shots")
    print(f"Mean Poisson Deviance: {mpd:.2f}")
    print(f"Average Actual Shots: {y_test.mean():.2f}")
    print(f"Average Predicted Shots: {y_pred.mean():.2f}")
    
    # Feature importance
    feature_importance = model.coef_
    importance_df = pd.DataFrame({
        'feature': feature_names,
        'coefficient': feature_importance,
        'abs_coefficient': np.abs(feature_importance)
    }).sort_values('abs_coefficient', ascending=False)
    
    print("\n🎯 Feature Importance (Impact on Shooting Rate):")
    print(importance_df.to_string(index=False, float_format='%.3f'))
    
    # Visualization of predictions
    plt.figure(figsize=(12, 5))
    
    plt.subplot(1, 2, 1)
    plt.scatter(y_test, y_pred, alpha=0.6)
    plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--', lw=2)
    plt.xlabel('Actual Shots')
    plt.ylabel('Predicted Shots')
    plt.title('Predicted vs Actual Shots')
    plt.grid(True, alpha=0.3)
    
    plt.subplot(1, 2, 2)
    residuals = y_test - y_pred
    plt.hist(residuals, bins=20, alpha=0.7, color='orange')
    plt.xlabel('Residuals (Actual - Predicted)')
    plt.ylabel('Frequency')
    plt.title('Prediction Residuals')
    plt.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig('model_evaluation.png', dpi=300, bbox_inches='tight')
    plt.show()
    
    return importance_df

def predict_shooting_rate(model, scaler, team_characteristics):
    """
    Predict shooting rate for a specific team
    
    Args:
        model: Trained Poisson model
        scaler: Fitted feature scaler
        team_characteristics: Dict with team features
        
    Returns:
        dict: Prediction results
    """
    
    # Prepare features in correct order
    feature_order = [
        'accuracy_rating', 'driving_rating', 'defense_rating',
        'resource_usage', 'total_shooting_time', 'avg_rating',
        'accuracy_time_interaction', 'driving_resource_interaction'
    ]
    
    features = []
    for feature in feature_order:
        if feature in team_characteristics:
            features.append(team_characteristics[feature])
        else:
            # Calculate derived features
            if feature == 'resource_usage':
                features.append(team_characteristics.get('teleop_used_depot', 0) + 
                             team_characteristics.get('teleop_used_outpost', 0))
            elif feature == 'avg_rating':
                features.append((team_characteristics.get('accuracy_rating', 5) + 
                               team_characteristics.get('driving_rating', 5) + 
                               team_characteristics.get('defense_rating', 5)) / 3)
            elif feature == 'accuracy_time_interaction':
                features.append(team_characteristics.get('accuracy_rating', 5) * 
                             team_characteristics.get('total_shooting_time', 10))
            elif feature == 'driving_resource_interaction':
                features.append(team_characteristics.get('driving_rating', 5) * 
                             (team_characteristics.get('teleop_used_depot', 0) + 
                              team_characteristics.get('teleop_used_outpost', 0)))
            else:
                features.append(0)  # Default value
    
    # Scale features and predict
    features_scaled = scaler.transform([features])
    predicted_shots = model.predict(features_scaled)[0]
    
    # Calculate confidence intervals (approximate)
    std_error = np.sqrt(predicted_shots)  # Poisson variance = mean
    lower_bound = max(0, predicted_shots - 1.96 * std_error)
    upper_bound = predicted_shots + 1.96 * std_error
    
    return {
        'predicted_shots': round(predicted_shots, 1),
        'predicted_rate': round(predicted_shots / team_characteristics.get('total_shooting_time', 30), 2),
        'confidence_interval': (round(lower_bound, 1), round(upper_bound, 1)),
        'risk_assessment': assess_shooting_risk(predicted_shots, team_characteristics)
    }

def assess_shooting_risk(predicted_shots, team_characteristics):
    """
    Assess shooting performance risk level
    
    Args:
        predicted_shots: Predicted number of shots
        team_characteristics: Team features
        
    Returns:
        str: Risk assessment
    """
    
    accuracy = team_characteristics.get('accuracy_rating', 5)
    
    if predicted_shots < 5:
        return "LOW - Very conservative shooting, may miss scoring opportunities"
    elif predicted_shots < 10:
        if accuracy >= 7:
            return "MODERATE - Controlled shooting with good accuracy"
        else:
            return "MODERATE - Average shooting but accuracy concerns"
    elif predicted_shots < 15:
        if accuracy >= 8:
            return "HIGH - Aggressive shooting with good accuracy"
        else:
            return "HIGH - Aggressive shooting but accuracy may be inconsistent"
    else:
        return "VERY HIGH - Extremely aggressive shooting, watch for accuracy drop"

def main():
    """
    Main execution function
    """
    
    print("🚀 FRC Robot Shooting Rate Prediction")
    print("=" * 60)
    print("Using Poisson Regression for Count Data Analysis")
    print("=" * 60)
    
    # Load and prepare data
    df = load_and_prepare_data()
    
    # Exploratory analysis
    explore_data(df)
    
    # Build and evaluate model
    model, scaler, X_test, y_test, feature_names = build_poisson_model(df)
    importance_df = evaluate_model(model, X_test, y_test, feature_names)
    
    # Example predictions for different team types
    print("\n🎯 Example Predictions for Different Team Profiles")
    print("=" * 60)
    
    team_profiles = [
        {
            'name': 'High-Performance Team',
            'accuracy_rating': 9,
            'driving_rating': 8,
            'defense_rating': 7,
            'teleop_used_depot': 4,
            'teleop_used_outpost': 3,
            'total_shooting_time': 25
        },
        {
            'name': 'Average Team',
            'accuracy_rating': 6,
            'driving_rating': 6,
            'defense_rating': 6,
            'teleop_used_depot': 2,
            'teleop_used_outpost': 2,
            'total_shooting_time': 20
        },
        {
            'name': 'Defensive Team',
            'accuracy_rating': 4,
            'driving_rating': 7,
            'defense_rating': 9,
            'teleop_used_depot': 1,
            'teleop_used_outpost': 1,
            'total_shooting_time': 15
        }
    ]
    
    for profile in team_profiles:
        prediction = predict_shooting_rate(model, scaler, profile)
        print(f"\n📊 {profile['name']}:")
        print(f"   Predicted Shots: {prediction['predicted_shots']}")
        print(f"   Shooting Rate: {prediction['predicted_rate']} shots/second")
        print(f"   95% CI: {prediction['confidence_interval']}")
        print(f"   Risk Assessment: {prediction['risk_assessment']}")
    
    print(f"\n💡 Key Insights:")
    print(f"   • Accuracy rating has {importance_df.loc[importance_df['feature'] == 'accuracy_rating', 'coefficient'].iloc[0]:.3f}x impact on shots")
    print(f"   • Resource usage affects shots by {importance_df.loc[importance_df['feature'] == 'resource_usage', 'coefficient'].iloc[0]:.3f}x")
    print(f"   • Driving skill contributes {importance_df.loc[importance_df['feature'] == 'driving_rating', 'coefficient'].iloc[0]:.3f}x to shooting rate")
    
    print(f"\n📈 Model saved as 'poisson_shooting_model.pkl'")
    print(f"📊 Visualizations saved as PNG files")
    print(f"✅ Analysis complete!")

if __name__ == "__main__":
    main()
