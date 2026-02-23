import boto3

s3 = boto3.client('s3', 
    endpoint_url='http://localhost:9000',
    aws_access_key_id='minioadmin',
    aws_secret_access_key='minioadmin',
    region_name='us-east-1'
)

try:
    s3.create_bucket(Bucket='sales-datasets')
    print("Bucket 'sales-datasets' created successfully!")
except Exception as e:
    print(f"Bucket creation error: {e}")
