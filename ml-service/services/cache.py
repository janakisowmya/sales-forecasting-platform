import pandas as pd
from typing import Dict, Tuple, Optional
from functools import lru_cache
import hashlib
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class DatasetCache:
    """
    Simple in-memory cache for datasets and preprocessed series
    """
    
    def __init__(self, ttl_seconds: int = 300):
        """
        Args:
            ttl_seconds: Time-to-live for cache entries (default 5 minutes)
        """
        self.ttl_seconds = ttl_seconds
        self._cache: Dict[str, Tuple[any, datetime]] = {}
    
    def _is_expired(self, timestamp: datetime) -> bool:
        """Check if cache entry is expired"""
        return datetime.now() - timestamp > timedelta(seconds=self.ttl_seconds)
    
    def _generate_key(self, url: str, granularity: str = '') -> str:
        """Generate cache key from URL and granularity"""
        key_str = f"{url}:{granularity}"
        return hashlib.md5(key_str.encode()).hexdigest()
    
    def get(self, url: str, granularity: str = '') -> Optional[any]:
        """
        Get cached data
        
        Args:
            url: Dataset URL
            granularity: Data granularity
            
        Returns:
            Cached data or None if not found/expired
        """
        key = self._generate_key(url, granularity)
        
        if key in self._cache:
            data, timestamp = self._cache[key]
            if not self._is_expired(timestamp):
                logger.info(f"Cache HIT for key {key[:8]}...")
                return data
            else:
                logger.info(f"Cache EXPIRED for key {key[:8]}...")
                del self._cache[key]
        
        logger.info(f"Cache MISS for key {key[:8]}...")
        return None
    
    def set(self, url: str, data: any, granularity: str = ''):
        """
        Store data in cache
        
        Args:
            url: Dataset URL
            data: Data to cache
            granularity: Data granularity
        """
        key = self._generate_key(url, granularity)
        self._cache[key] = (data, datetime.now())
        logger.info(f"Cached data for key {key[:8]}... (TTL: {self.ttl_seconds}s)")
    
    def clear(self):
        """Clear all cache entries"""
        self._cache.clear()
        logger.info("Cache cleared")
    
    def cleanup_expired(self):
        """Remove expired entries from cache"""
        expired_keys = [
            key for key, (_, timestamp) in self._cache.items()
            if self._is_expired(timestamp)
        ]
        for key in expired_keys:
            del self._cache[key]
        if expired_keys:
            logger.info(f"Cleaned up {len(expired_keys)} expired cache entries")

# Global cache instance
dataset_cache = DatasetCache(ttl_seconds=300)
