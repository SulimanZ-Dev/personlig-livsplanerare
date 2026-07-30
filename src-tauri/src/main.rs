#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{WebviewUrl, WebviewWindowBuilder};

const LIVE_APP_URL: &str = "https://personlig-livsplanerare.vercel.app";

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            WebviewWindowBuilder::new(
                app,
                "main",
                WebviewUrl::External(LIVE_APP_URL.parse().expect("valid production URL")),
            )
            .title("Livssystem")
            .inner_size(430.0, 860.0)
            .min_inner_size(360.0, 640.0)
            .resizable(true)
            .build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("failed to run Livssystem");
}
