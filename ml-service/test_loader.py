from services.data_loader import load_data_from_url, preprocess_data

# Use the actual dataset URL running on the local server or just a local file path
import pandas as pd

try:
    with open('../sample-data.csv', 'r') as f:
        text = f.read()

    from io import StringIO
    df = pd.read_csv(StringIO(text))
    # Emulate the fix
    df.columns = df.columns.str.strip().str.replace('\ufeff', '')

    print("Columns are:", df.columns.tolist())
    train, test = preprocess_data(df, granularity='daily')
    print("SUCCESS. Train size:", len(train), "Test size:", len(test))
except Exception as e:
    import traceback
    traceback.print_exc()
