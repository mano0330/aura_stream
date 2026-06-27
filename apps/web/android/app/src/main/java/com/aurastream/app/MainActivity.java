package com.aurastream.app;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private final android.content.BroadcastReceiver mediaActionReceiver = new android.content.BroadcastReceiver() {
        @Override
        public void onReceive(android.content.Context context, Intent intent) {
            final String action = intent.getStringExtra("action");
            if (action != null && bridge != null && bridge.getWebView() != null) {
                bridge.getWebView().post(new Runnable() {
                    @Override
                    public void run() {
                        String js = "";
                        if ("PLAY".equals(action)) {
                            js = "window.dispatchEvent(new CustomEvent('media-session-play'));";
                        } else if ("PAUSE".equals(action)) {
                            js = "window.dispatchEvent(new CustomEvent('media-session-pause'));";
                        } else if ("NEXT".equals(action)) {
                            js = "window.dispatchEvent(new CustomEvent('media-session-next'));";
                        } else if ("PREVIOUS".equals(action)) {
                            js = "window.dispatchEvent(new CustomEvent('media-session-prev'));";
                        }
                        bridge.getWebView().evaluateJavascript(js, null);
                    }
                });
            }
        }
    };

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // 1. Register JavaScript Interface for WebView communication
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().addJavascriptInterface(new Object() {
                @android.webkit.JavascriptInterface
                public void updateTrack(final String title, final String artist, final boolean isPlaying) {
                    Intent intent = new Intent(MainActivity.this, AudioService.class);
                    intent.putExtra("title", title);
                    intent.putExtra("artist", artist);
                    intent.putExtra("isPlaying", isPlaying);
                    intent.setAction(isPlaying ? "PLAY" : "PAUSE");
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        startForegroundService(intent);
                    } else {
                        startService(intent);
                    }
                }
            }, "AndroidAudio");
        }

        // 2. Register Broadcast Receiver for media notification controls
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(mediaActionReceiver, 
                new android.content.IntentFilter("com.aurastream.app.MEDIA_ACTION"), 
                RECEIVER_EXPORTED);
        } else {
            registerReceiver(mediaActionReceiver, 
                new android.content.IntentFilter("com.aurastream.app.MEDIA_ACTION"));
        }

        startAudioService();
    }

    @Override
    public void onResume() {
        super.onResume();
        startAudioService();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        try {
            unregisterReceiver(mediaActionReceiver);
        } catch (Exception e) { /* ignore */ }
        stopService(new Intent(this, AudioService.class));
    }

    @Override
    public void onPause() {
        super.onPause();
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().onResume();
        }
    }

    @Override
    public void onStop() {
        super.onStop();
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().onResume();
        }
    }

    private void startAudioService() {
        Intent serviceIntent = new Intent(this, AudioService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent);
        } else {
            startService(serviceIntent);
        }
    }
}
