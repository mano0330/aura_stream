package com.aurastream.app;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Enable hardware acceleration
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            WebView.setWebContentsDebuggingEnabled(false);
        }

        // Start background audio service
        startAudioService();
    }

    @Override
    protected void onResume() {
        super.onResume();
        // Re-acquire audio focus on resume
        startAudioService();
    }

    private void startAudioService() {
        Intent serviceIntent = new Intent(this, AudioService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent);
        } else {
            startService(serviceIntent);
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        // Stop service only when app is fully closed
        stopService(new Intent(this, AudioService.class));
    }
}
