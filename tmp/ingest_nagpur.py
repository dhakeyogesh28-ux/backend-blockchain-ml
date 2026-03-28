import pandas as pd
import numpy as np
import os
from datetime import datetime

# Define the provided Nagpur dataset
nagpur_data = [
    ["Sitabuldi", 21.1458, 79.0882, 22, "Friday", 1, "commercial", 0.9, 0.85],
    ["Sitabuldi", 21.1458, 79.0882, 14, "Monday", 0, "commercial", 0.95, 0.5],
    ["Dharampeth", 21.1355, 79.0700, 23, "Saturday", 1, "residential", 0.5, 0.7],
    ["Dharampeth", 21.1355, 79.0700, 11, "Tuesday", 0, "residential", 0.85, 0.3],
    ["Itwari", 21.1550, 79.1050, 21, "Friday", 1, "market", 0.95, 0.9],
    ["Itwari", 21.1550, 79.1050, 10, "Wednesday", 0, "market", 0.98, 0.6],
    ["Sadar", 21.1600, 79.0800, 23, "Sunday", 1, "commercial", 0.7, 0.75],
    ["Sadar", 21.1600, 79.0800, 13, "Thursday", 0, "commercial", 0.9, 0.4],
    ["Nagpur Railway Station", 21.1520, 79.0880, 22, "Saturday", 1, "transport", 0.85, 0.9],
    ["Nagpur Railway Station", 21.1520, 79.0880, 12, "Monday", 0, "transport", 0.9, 0.5],
    ["Wardha Road", 21.0900, 79.0600, 23, "Friday", 1, "highway", 0.6, 0.8],
    ["Wardha Road", 21.0900, 79.0600, 15, "Tuesday", 0, "highway", 0.8, 0.4],
    ["Manish Nagar", 21.1100, 79.0700, 22, "Sunday", 1, "residential", 0.4, 0.65],
    ["Manish Nagar", 21.1100, 79.0700, 11, "Wednesday", 0, "residential", 0.75, 0.3],
    ["Hingna MIDC", 21.0800, 78.9900, 23, "Saturday", 1, "industrial", 0.3, 0.75],
    ["Hingna MIDC", 21.0800, 78.9900, 14, "Tuesday", 0, "industrial", 0.6, 0.5]
]

columns = ["area", "lat", "lng", "hour", "day", "isNight", "area_type", "crowd_level", "crime_density"]
df_nagpur = pd.DataFrame(nagpur_data, columns=columns)

day_map = {"Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3, "Friday": 4, "Saturday": 5, "Sunday": 6}

def map_to_training(row):
    # Mapping logic to match zone_training_data.csv format
    ts = datetime(2024, 3, 28, row["hour"], 0, 0).strftime("%Y-%m-%d %H:%M:%S")
    
    # Generate News/Incident counts from crime_density
    # 0.9 -> ~5 news alerts
    news_count = int(round(row["crime_density"] * 5))
    violence_count = int(round(row["crime_density"] * 2))
    past_incidents = int(round(row["crime_density"] * 4))
    
    label = "green"
    if row["crime_density"] > 0.75:
        label = "red"
    elif row["crime_density"] > 0.45:
        label = "orange"
        
    return {
        "latitude": row["lat"],
        "longitude": row["lng"],
        "timestamp": ts,
        "news_crime_count": news_count,
        "news_violence_count": violence_count,
        "social_media_alert_count": int(round(row["crowd_level"] * 6)),
        "social_media_sentiment_score": 1.0 - (row["crime_density"] * 0.8),
        "gov_report_count": int(round(row["crime_density"] * 2)),
        "past_incident_count": past_incidents,
        "time_of_day_hour": row["hour"],
        "day_of_week": day_map[row["day"]],
        "is_weekend": 1 if row["day"] in ["Saturday", "Sunday"] else 0,
        "population_density": row["crowd_level"],
        "weather_severity": 0.1, # Default
        "risk_label": label
    }

ready_data = [map_to_training(r) for _, r in df_nagpur.iterrows()]
df_final = pd.DataFrame(ready_data)

# --- Data Augmentation ---
print("Augmenting data for Nagpur...")
augmented_samples = []
for _, row in df_final.iterrows():
    for _ in range(50): # 50 samples per original point
        new_row = row.copy()
        # Add slight spatial jitter (approx 500m)
        new_row["latitude"] += np.random.normal(0, 0.005)
        new_row["longitude"] += np.random.normal(0, 0.005)
        # Add slight temporal jitter
        new_row["time_of_day_hour"] = (new_row["time_of_day_hour"] + np.random.randint(-1, 2)) % 24
        # Randomize counts slightly
        new_row["news_crime_count"] = max(0, new_row["news_crime_count"] + np.random.randint(-1, 2))
        new_row["past_incident_count"] = max(0, new_row["past_incident_count"] + np.random.randint(-1, 2))
        augmented_samples.append(new_row)

df_aug = pd.DataFrame(augmented_samples)
print(f"Generated {len(df_aug)} augmented samples.")

# Appending to main training file
main_csv = "y:/Nivaran-main/ml/data/zone_training_data.csv"
if os.path.exists(main_csv):
    df_existing = pd.read_csv(main_csv)
    df_combined = pd.concat([df_existing, df_aug], ignore_index=True)
    df_combined.to_csv(main_csv, index=False)
    print(f"Updated {main_csv} with Nagpur data. Total rows: {len(df_combined)}")
else:
    df_aug.to_csv(main_csv, index=False)
    print(f"Created {main_csv} with Nagpur data.")
