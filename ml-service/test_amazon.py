from services.data_loader import preprocess_data
import pandas as pd
import traceback

try:
    print("Loading amazon.csv...")
    df = pd.read_csv('../../insight-readiness-analyzer/amazon.csv')
    df.columns = df.columns.str.strip().str.replace('\ufeff', '')
    
    print("Columns are:", df.columns.tolist())
    print("Row count:", len(df))
    
    print("\nAttempting preprocess_data...")
    train, test = preprocess_data(df, granularity='daily')
    print("SUCCESS. Train size:", len(train), "Test size:", len(test))
except Exception as e:
    print("ERROR CAUGHT:")
    traceback.print_exc()
