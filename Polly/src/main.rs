// src/main.rs

mod config;
mod route;
mod schedule;
mod utils;

use std::path::PathBuf;

use anyhow::Result;
use clap::{Parser, Subcommand};

/// Polly CLI Tool
#[derive(Parser)]
#[command(author, version, about, long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Bus Route Information Collection and Snapping (Route Processor)
    Route {
        /// City code to process (default: Wonju -> 32020)
        #[arg(long, default_value = "32020")]
        city_code: String,

        /// Specific route number (if not specified, all)
        #[arg(short, long)]
        route: Option<String>,

        /// Output directory
        #[arg(short, long, default_value = "./storage/processed_routes")]
        output_dir: PathBuf,

        /// Update station map only and skip snapping
        #[arg(long)]
        station_map_only: bool,

        /// Snap route paths using OSRM only (skip Tago API)
        #[arg(long)]
        osrm_only: bool,
    },
    /// Bus Schedule Crawling (Schedule Processor)
    Schedule {
        /// Specific route number (if not specified, all)
        #[arg(short, long)]
        route: Option<String>,

        /// Output directory
        #[arg(short, long, default_value = "./storage")]
        output_dir: PathBuf,
    },
}

#[tokio::main]
async fn main() -> Result<()> {
    // Load environment variables from .env file
    dotenvy::dotenv().ok();

    let cli = Cli::parse();

    match cli.command {
        Commands::Route {
            city_code,
            route,
            output_dir,
            station_map_only,
            osrm_only,
        } => {
            route::run(city_code, route, output_dir, station_map_only, osrm_only).await?;
        }
        Commands::Schedule { route, output_dir } => {
            schedule::run(route, output_dir).await?;
        }
    }

    Ok(())
}
