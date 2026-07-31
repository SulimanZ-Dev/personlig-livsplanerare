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
            .inner_size(1180.0, 820.0)
            .min_inner_size(390.0, 650.0)
            .center()
            .resizable(true)
            .build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("failed to run Livssystem");
}
