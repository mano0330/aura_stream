package com.aurastream.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.os.Build;
import android.os.IBinder;
import androidx.annotation.Nullable;

public class AudioService extends Service {
    private static final String CHANNEL_ID = "aura_stream_audio";
    private static final int NOTIFICATION_ID = 1;

    private MediaSession mediaSession;
    private android.os.PowerManager.WakeLock wakeLock;
    private AudioManager audioManager;
    private AudioFocusRequest audioFocusRequest;
    private AudioManager.OnAudioFocusChangeListener focusChangeListener;
    private String currentTitle = "Aura Stream";
    private String currentArtist = "Music is playing...";

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();

        // 1. Initialize Media Session
        mediaSession = new MediaSession(this, "AuraStreamSession");
        mediaSession.setActive(true);
        mediaSession.setCallback(new MediaSession.Callback() {
            @Override
            public void onPlay() {
                super.onPlay();
                broadcastMediaAction("PLAY");
            }

            @Override
            public void onPause() {
                super.onPause();
                broadcastMediaAction("PAUSE");
            }

            @Override
            public void onSkipToNext() {
                super.onSkipToNext();
                broadcastMediaAction("NEXT");
            }

            @Override
            public void onSkipToPrevious() {
                super.onSkipToPrevious();
                broadcastMediaAction("PREVIOUS");
            }
        });

        // 2. Request Audio Focus
        audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        focusChangeListener = new AudioManager.OnAudioFocusChangeListener() {
            @Override
            public void onAudioFocusChange(int focusChange) {
                if (focusChange == AudioManager.AUDIOFOCUS_LOSS || focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) {
                    broadcastMediaAction("PAUSE");
                }
            }
        };

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            AudioAttributes playbackAttributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                .build();
            audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(playbackAttributes)
                .setAcceptsDelayedFocusGain(true)
                .setOnAudioFocusChangeListener(focusChangeListener)
                .build();
            audioManager.requestAudioFocus(audioFocusRequest);
        } else {
            audioManager.requestAudioFocus(focusChangeListener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN);
        }

        // 3. Start foreground with initial notification and type mediaPlayback
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, buildNotification(currentTitle, currentArtist, false), 
                android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTIFICATION_ID, buildNotification(currentTitle, currentArtist, false));
        }

        // 4. Acquire WakeLock
        android.os.PowerManager powerManager = (android.os.PowerManager) getSystemService(POWER_SERVICE);
        if (powerManager != null) {
            wakeLock = powerManager.newWakeLock(android.os.PowerManager.PARTIAL_WAKE_LOCK, "AuraStream::WakeLock");
            wakeLock.acquire();
        }
    }

    private void broadcastMediaAction(String action) {
        Intent intent = new Intent("com.aurastream.app.MEDIA_ACTION");
        intent.putExtra("action", action);
        sendBroadcast(intent);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String action = intent.getAction();
            String title = intent.getStringExtra("title");
            String artist = intent.getStringExtra("artist");

            // If triggered by notification actions, broadcast the command to the web layer
            if (action != null && ("PLAY".equals(action) || "PAUSE".equals(action) || "NEXT".equals(action) || "PREVIOUS".equals(action))) {
                broadcastMediaAction(action);
            }

            boolean isPlaying = "PLAY".equals(action) || (action == null && intent.getBooleanExtra("isPlaying", false));

            if (title != null) {
                currentTitle = title;
            }
            if (artist != null) {
                currentArtist = artist;
            }

            // Update Media Session State
            PlaybackState.Builder stateBuilder = new PlaybackState.Builder()
                .setActions(PlaybackState.ACTION_PLAY | PlaybackState.ACTION_PAUSE | PlaybackState.ACTION_SKIP_TO_NEXT | PlaybackState.ACTION_SKIP_TO_PREVIOUS);
            stateBuilder.setState(isPlaying ? PlaybackState.STATE_PLAYING : PlaybackState.STATE_PAUSED, PlaybackState.PLAYBACK_POSITION_UNKNOWN, 1.0f);
            mediaSession.setPlaybackState(stateBuilder.build());

            updateNotification(currentTitle, currentArtist, isPlaying);
        }
        return START_STICKY;
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Aura Stream Music",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Shows currently playing music");
            channel.setSound(null, null);
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) manager.createNotificationChannel(channel);
        }
    }

    private Notification buildNotification(String title, String text, boolean isPlaying) {
        Intent launchIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // Define intent and pending intent actions
        Intent playIntent = new Intent(this, AudioService.class).setAction("PLAY");
        PendingIntent playPendingIntent = PendingIntent.getService(this, 10, playIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Intent pauseIntent = new Intent(this, AudioService.class).setAction("PAUSE");
        PendingIntent pausePendingIntent = PendingIntent.getService(this, 11, pauseIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Intent prevIntent = new Intent(this, AudioService.class).setAction("PREVIOUS");
        PendingIntent prevPendingIntent = PendingIntent.getService(this, 12, prevIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Intent nextIntent = new Intent(this, AudioService.class).setAction("NEXT");
        PendingIntent nextPendingIntent = PendingIntent.getService(this, 13, nextIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Notification.Builder builder = new Notification.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentIntent(pendingIntent)
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .setOngoing(true);

        // Add Prev/Play/Pause/Next actions
        builder.addAction(new Notification.Action.Builder(
            android.R.drawable.ic_media_previous, "Previous", prevPendingIntent).build());

        if (isPlaying) {
            builder.addAction(new Notification.Action.Builder(
                android.R.drawable.ic_media_pause, "Pause", pausePendingIntent).build());
        } else {
            builder.addAction(new Notification.Action.Builder(
                android.R.drawable.ic_media_play, "Play", playPendingIntent).build());
        }

        builder.addAction(new Notification.Action.Builder(
            android.R.drawable.ic_media_next, "Next", nextPendingIntent).build());

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            builder.setStyle(new Notification.MediaStyle()
                .setMediaSession(mediaSession.getSessionToken())
                .setShowActionsInCompactView(0, 1, 2)
            );
        }

        return builder.build();
    }

    private void updateNotification(String title, String text, boolean isPlaying) {
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.notify(NOTIFICATION_ID, buildNotification(title, text, isPlaying));
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (mediaSession != null) {
            mediaSession.release();
        }
        if (audioManager != null && focusChangeListener != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && audioFocusRequest != null) {
                audioManager.abandonAudioFocusRequest(audioFocusRequest);
            } else {
                audioManager.abandonAudioFocus(focusChangeListener);
            }
        }
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
    }
}
