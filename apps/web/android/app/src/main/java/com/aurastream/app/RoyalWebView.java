package com.aurastream.app;

import android.content.Context;
import android.util.AttributeSet;
import android.view.View;
import android.webkit.WebView;

public class RoyalWebView extends WebView {
    public RoyalWebView(Context context) {
        super(context);
    }

    public RoyalWebView(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    public RoyalWebView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
    }

    @Override
    protected void onWindowVisibilityChanged(int visibility) {
        // Prevent the WebView from pausing JavaScript timers and HTML5 media by forcing visibility to VISIBLE
        super.onWindowVisibilityChanged(View.VISIBLE);
    }
}
