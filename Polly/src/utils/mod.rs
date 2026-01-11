// src/utils/mod.rs

use std::fs;
use std::path::Path;

use anyhow::Result;

pub fn ensure_dir(path: &Path) -> Result<()> {
    if !path.exists() {
        fs::create_dir_all(path)?;
    }
    Ok(())
}

pub fn get_env(key: &str) -> String {
    std::env::var(key).unwrap_or_else(|_| "".to_string())
}
