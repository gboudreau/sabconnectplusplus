// Background Service Worker for SABconnect++
// Manifest V3 compatible

// Simplified store implementation for service worker
class ServiceWorkerStore {
    constructor(name, defaults) {
        this.name = name;
        this.defaults = defaults || {};
        this.data = {};
        this.isReady = false;
        this.readyCallbacks = [];
    }

    init(callback) {
        chrome.storage.local.get(null, (result) => {
            this.data = { ...this.defaults, ...result };
            this.isReady = true;
            if (callback) callback();
            this.readyCallbacks.forEach(cb => cb());
            this.readyCallbacks = [];
        });
    }

    get(key) {
        return this.data[key];
    }

    set(key, value) {
        this.data[key] = value;
        chrome.storage.local.set({ [key]: value });
    }

    fromObject(obj) {
        this.data = { ...obj };
        chrome.storage.local.set(obj);
    }

    ready(callback) {
        if (this.isReady) {
            callback();
        } else {
            this.readyCallbacks.push(callback);
        }
    }
}

// Simple ProfileManager implementation
class SimpleProfileManager {
    constructor() {
        this.store = store;
    }

    getActiveProfile() {
        const profiles = this.store.get('profiles') || {};
        const activeProfileName = this.store.get('active_profile') || this.store.get('activeProfile') || 'Default';
        return {
            name: activeProfileName,
            values: profiles[activeProfileName] || {
                url: this.store.get('sabnzbd_url'),
                api_key: this.store.get('sabnzbd_api_key'),
                username: this.store.get('sabnzbd_username'),
                password: this.store.get('sabnzbd_password')
            }
        };
    }

    setActiveProfile(name) {
        this.store.set('active_profile', name);
        this.store.set('activeProfile', name); // Keep both for compatibility
    }

    getFirstProfile() {
        const profiles = this.store.get('profiles') || {};
        const firstKey = Object.keys(profiles)[0];
        return firstKey ? { name: firstKey, values: profiles[firstKey] } : null;
    }

    add(name, values) {
        const profiles = this.store.get('profiles') || {};
        if (profiles[name]) {
            throw 'already_exists';
        }
        profiles[name] = values;
        this.store.set('profiles', profiles);
    }
}

// Default settings
var defaultSettings = {
    sabnzbd_url: 'http://localhost:8080/',
    sabnzbd_api_key: '',
    sabnzbd_username: '',
    provider_binsearch: true,
    provider_bintube: true,
    provider_dognzb: true,
    provider_fanzub: true,
    provider_animezb: true,
    provider_animenzb: true,
    provider_nzbclub: true,
    provider_nzbindex: true,
    provider_yubse: true,
    provider_omgwtfnzbs: true,
    provider_nzbrss: true,
    provider_newznab: 'your_newznab.com, some_other_newznab.com',
    provider_usenet4ever: true,
    use_name_binsearch: true,
    use_name_nzbindex: true,
    use_name_yubse: true,
    config_refresh_rate: 15,
    config_enable_graph: true,
    config_enable_context_menu: true,
    config_enable_notifications: true,
    config_notification_timeout: 10,
    config_ignore_categories: false,
    config_use_user_categories: false,
    config_use_category_header: false,
    config_hard_coded_category: '',
    config_default_category: '',
    config_enable_automatic_authentication: true,
    config_enable_automatic_detection: true,
    profiles: {},
    first_profile_initialized: false,
    active_category: '*',
    settings_synced: false,
    // Custom notification rules
    notification_rules: {
        completion_enabled: true,
        completion_categories: [], // Empty = all categories
        failure_enabled: true,
        low_disk_space_enabled: true,
        low_disk_space_threshold: 1024, // MB
        speed_threshold_enabled: false,
        speed_threshold_value: 100 // KB/s
    },
    // Download statistics
    download_statistics: {
        enabled: true,
        daily: {},
        weekly: {},
        monthly: {},
        all_time: {
            total_downloads: 0,
            total_size_bytes: 0,
            total_failed: 0,
            average_speed: 0,
            first_download: null
        }
    },
    // Auto-pause scheduling
    auto_pause_schedule: {
        enabled: false,
        pause_time: '02:00',
        resume_time: '08:00',
        days: [1, 2, 3, 4, 5], // Monday to Friday (0=Sunday, 6=Saturday)
        last_action: null,
        next_pause: null,
        next_resume: null
    }
};

// Initialize store and profiles
var store = new ServiceWorkerStore('settings', defaultSettings);
var profiles = new SimpleProfileManager();

// Utility functions
function activeProfile() {
    try {
        var profile = profiles.getActiveProfile();
        if (!profile || !profile.values) {
            console.error('activeProfile: No active profile found');
            return null;
        }
        return profile.values;
    } catch (e) {
        console.error('activeProfile error:', e);
        return null;
    }
}

function checkEndSlash(input) {
    if (input.charAt(input.length-1) == '/') {
        return input;
    } else {
        return input + '/';
    }
}

function constructApiUrl(profileValues) {
    var profile = profileValues || activeProfile();
    if (!profile || !profile.url) {
        console.error('constructApiUrl: No valid profile or URL found');
        return null;
    }
    return checkEndSlash(profile.url) + 'api';
}

function constructApiPost(profileValues) {
    var profile = profileValues || activeProfile();
    var data = {};
    
    var apikey = profile.api_key;
    if (apikey) {
        data.apikey = apikey;
    }

    var username = profile.username;
    if (username) {
        data.ma_username = username;
    }

    var password = profile.password;
    if (password) {
        data.ma_password = password;
    }
    
    return data;
}

function getRefreshRate() {
    var rawValue = store.get('config_refresh_rate');
    var parsedValue = parseInt(rawValue);
    var finalValue = parsedValue * 1000;
    return finalValue;
}

// Main functionality
function fileSizes(value, decimals) {
    if(decimals == null) decimals = 2;
    var kb = value / 1024;
    var mb = value / 1048576;
    var gb = value / 1073741824;
    var tb = value / 1099511627776; // 1024^4
    
    if (tb >= 1) {
        return tb.toFixed(decimals) + "TB";
    } else if (gb >= 1) {
        return gb.toFixed(decimals) + "GB";
    } else if (mb >= 1) {
        return mb.toFixed(decimals) + "MB";
    } else {
        return kb.toFixed(decimals) + "KB";
    }
}

function updateBadge(data) {
    if (data) {
        var slots = data.queue.noofslots;
        var badge = {};
        if (!slots) {
            badge.text = '';
        } else {
            badge.text = slots.toString();
        }
        chrome.action.setBadgeText(badge);
    }
}

function isDownloading(kbpersec) {
    return kbpersec && parseFloat(kbpersec) > 1;
}

function updateBackground(data) {
    if (data) {
        var badgeColor = {}
        if (isDownloading(data.queue.kbpersec)) {
            badgeColor.color = [0, 213, 7, 100];
        } else {
            badgeColor.color = [255, 0, 0, 100];
        }
        chrome.action.setBadgeBackgroundColor(badgeColor)
    }
}

function updateSpeedLog(data) {
    chrome.storage.local.get(['speedlog'], function(result) {
        var speedlog = [];
        
        if (result.speedlog) {
            speedlog = JSON.parse(result.speedlog);
            while (speedlog.length >= 10) {
                speedlog.shift();
            }
        }
        
        speedlog.push(data ? parseFloat(data.queue.kbpersec) : 0);
        chrome.storage.local.set({ speedlog: JSON.stringify(speedlog) });
    });
}

function fetchInfoSuccess(data, quickUpdate, callback) {
    if (!data || data.error) {
        chrome.storage.local.set({ 
            error: data ? data.error : 'Success with no data?'
        });
        
        if (callback) callback();
        return;
    }
    
    var currentProfile = store.get('active_profile') || store.get('activeProfile') || 'Default';
    if (currentProfileForRefresh && currentProfileForRefresh !== currentProfile) {
        if (callback) callback();
        return;
    }
    
    var currentData = {
        error: '',
        timeleft: data ? data.queue.timeleft : '0',
        speed: data ? data.queue.speed + 'B/s' : '-',
        sizeleft: '',
        queue: data ? JSON.stringify(data.queue.slots) : '',
        queue_info: data ? JSON.stringify(data.queue) : '',  // Store full queue info for disk space
        status: data ? data.queue.status : '',
        paused: data ? data.queue.paused === true : false
    };
    
    chrome.storage.local.set(currentData);
    
    // Cache this successful data for instant popup loading (with profile info)
    var activeProfileName = store.get('active_profile') || store.get('activeProfile') || 'Default';
    chrome.storage.local.set({ 
        last_successful_data: currentData,
        last_successful_timestamp: Date.now(),
        last_successful_profile: activeProfileName
    });
    
    var additionalData = {};
    
    if (data && data.queue.paused) {
        additionalData.pause_int = data.queue.pause_int;
        chrome.storage.local.set({ pause_int: data.queue.pause_int });
    }
    
    if (!quickUpdate) {
        updateSpeedLog(data);
    }

    var queueSize = '';
    if (data && data.queue.mbleft > 0) {
        var bytesInMegabyte = 1048576;
        var bytesLeft = data.queue.mbleft * bytesInMegabyte;
        queueSize = fileSizes(bytesLeft);
    }
    additionalData.sizeleft = queueSize;
    chrome.storage.local.set({ sizeleft: queueSize });
    
    if (Object.keys(additionalData).length > 0) {
        chrome.storage.local.get(['last_successful_data'], function(result) {
            var updatedCache = { ...currentData, ...additionalData };
            chrome.storage.local.set({ last_successful_data: updatedCache });
        });
    }
    
    updateBadge(data);
    updateBackground(data);

    if (callback) callback();
}

function fetchInfoError(error, callback) {
    chrome.storage.local.set({ 
        error: 'Could not connect to SABnzbd - Check it is running, the details in this plugin\'s settings are correct and that you are running at least SABnzbd version 0.5!',
        diskspacetotal1: null,
        diskspace1: null,
        sizeleft: '',
        pause_int: null,
        last_successful_data: null,
        last_successful_timestamp: null,
        last_successful_profile: null
    });
    
    if (callback) callback();
}

function sendSabRequest(params, success_callback, error_callback, profileValues) {
    var profile = profileValues || activeProfile();
    
    if (!profile) {
        console.error('sendSabRequest: No profile available');
        if (error_callback) error_callback(new Error('No profile configured'));
        return;
    }
    
    var sabApiUrl = constructApiUrl(profile);
    if (!sabApiUrl) {
        console.error('sendSabRequest: Could not construct API URL');
        if (error_callback) error_callback(new Error('Invalid SABnzbd URL'));
        return;
    }
    
    var data = constructApiPost(profile);
    data.output = 'json';
    
    for (var key in params) {
        data[key] = params[key];
    }
    
    
    var url = new URL(sabApiUrl);
    Object.keys(data).forEach(key => url.searchParams.append(key, data[key]));
    
    var headers = {};
    if (profile.username && profile.password) {
        headers['Authorization'] = 'Basic ' + btoa(profile.username + ':' + profile.password);
    }
    
    
    // Create AbortController for timeout
    var controller = new AbortController();
    var timeoutId = setTimeout(() => controller.abort(), 5000);
    
    fetch(url, {
        method: 'GET',
        headers: headers,
        signal: controller.signal
    })
    .then(response => {
        clearTimeout(timeoutId);
        if (!response.ok) {
            throw new Error('HTTP ' + response.status + ': ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        if (success_callback) success_callback(data);
    })
    .catch(error => {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            console.error('sendSabRequest: Request timed out after 5 seconds');
            if (error_callback) error_callback(new Error('Request timed out'));
        } else {
            console.error('sendSabRequest: Error:', error);
            if (error_callback) error_callback(error);
        }
    });
}

function fetchInfo(quickUpdate, callback, profileValues) {
    var params = {
        mode: 'queue',
        limit: '5'
    };
    
    sendSabRequest(
        params,
        function(data) { fetchInfoSuccess(data, quickUpdate, callback); },
        function(error) { fetchInfoError(error, callback); },
        profileValues
    );
}

function testConnection(profileValues, callback) {
    fetchInfo(true, callback, profileValues);
}

function setMaxSpeed(speed, success_callback, error_callback) {
    
    // Validate input
    if (!speed && speed !== '0') {
        console.error('setMaxSpeed: Invalid speed value:', speed);
        if (error_callback) error_callback('Invalid speed value');
        return;
    }
    
    var params = {
        mode: 'config',
        name: 'speedlimit',
        value: speed
    };
    
    
    sendSabRequest(params, 
        function(data) {
            if (success_callback) success_callback(data);
        }, 
        function(error) {
            if (error_callback) error_callback(error);
        }
    );
}

function getMaxSpeed(success_callback, error_callback) {
    
    // Use queue mode to get speedlimit since get_speedlimit is not implemented
    var params = {
        mode: 'queue',
        limit: '0'  // Don't need queue items, just the queue info
    };
    
    
    sendSabRequest(params, 
        function(data) {
            if (success_callback) success_callback(data);
        },
        function(error) {
            if (error_callback) error_callback(error);
        }
    );
}

function refresh(quick, callback) {
    var refreshStartProfile = store.get('active_profile') || store.get('activeProfile') || 'Default';
    
    if (!callback) {
        callback = function() {
            chrome.runtime.sendMessage({ action: 'refresh_popup' });
        };
    }
    
    fetchInfo(quick, function() {
        var refreshEndProfile = store.get('active_profile') || store.get('activeProfile') || 'Default';
        if (refreshStartProfile !== refreshEndProfile) {
            return;
        }
        if (!quick) {
            checkNotificationRules();
            updateScheduleStatus();
        }
        if (callback) callback();
    });
    
    if (!quick && store.get('config_enable_notifications') === true) {
        var params = {
            mode: 'history',
            limit: '10'
        };
        sendSabRequest(params, function(data) {
            checkCompletionNotifications(data);
        });
    }
}

function checkNotificationRules() {
    chrome.storage.local.get(['queue_info'], function(result) {
        if (!result.queue_info) return;
        
        try {
            var queueData = JSON.parse(result.queue_info);
            var rules = store.get('notification_rules') || {};
            
            if (rules.low_disk_space_enabled && queueData.diskspace1) {
                var availableGB = parseFloat(queueData.diskspace1);
                var thresholdGB = rules.low_disk_space_threshold / 1024;
                
                if (availableGB < thresholdGB) {
                    showNotification(
                        'Low Disk Space Warning',
                        `Only ${availableGB.toFixed(1)}GB remaining`,
                        'warning'
                    );
                }
            }
            
            if (rules.speed_threshold_enabled && queueData.kbpersec) {
                var currentSpeed = parseFloat(queueData.kbpersec);
                
                if (currentSpeed > 0 && currentSpeed < rules.speed_threshold_value) {
                    showNotification(
                        'Slow Download Speed',
                        `Current speed: ${currentSpeed.toFixed(1)} KB/s`,
                        'info'
                    );
                }
            }
            
        } catch (e) {
            console.error('Error checking notification rules:', e);
        }
    });
}

function checkCompletionNotifications(historyData) {
    if (!historyData || !historyData.history || !historyData.history.slots) return;
    
    var rules = store.get('notification_rules') || {};
    
    historyData.history.slots.forEach(function(item) {
        var completedTime = new Date(item.completed * 1000);
        var now = new Date();
        var timeDiff = now - completedTime;
        
        updateDownloadStatistics(item);
        
        if (timeDiff < 5 * 60 * 1000) {
            if (item.status === 'Completed' && rules.completion_enabled) {
                if (rules.completion_categories.length === 0 || 
                    rules.completion_categories.includes(item.category)) {
                    showNotification(
                        'Download Completed',
                        item.name,
                        'success'
                    );
                }
            } else if (item.status === 'Failed' && rules.failure_enabled) {
                showNotification(
                    'Download Failed',
                    `${item.name} - ${item.fail_message || 'Unknown error'}`,
                    'error'
                );
            }
        }
    });
}

function updateDownloadStatistics(item) {
    var stats = store.get('download_statistics') || defaultSettings.download_statistics;
    if (!stats.enabled) return;
    
    var completedTime = new Date(item.completed * 1000);
    var dateKey = getDateKey(completedTime);
    var weekKey = getWeekKey(completedTime);
    var monthKey = getMonthKey(completedTime);
    
    var sizeBytes = parseFloat(item.bytes || 0);
    var isCompleted = item.status === 'Completed';
    var isFailed = item.status === 'Failed';
    if (!stats.daily[dateKey]) {
        stats.daily[dateKey] = createEmptyStats();
    }
    if (!stats.weekly[weekKey]) {
        stats.weekly[weekKey] = createEmptyStats();
    }
    if (!stats.monthly[monthKey]) {
        stats.monthly[monthKey] = createEmptyStats();
    }
    if (isCompleted) {
        stats.daily[dateKey].downloads++;
        stats.daily[dateKey].total_size += sizeBytes;
        stats.weekly[weekKey].downloads++;
        stats.weekly[weekKey].total_size += sizeBytes;
        stats.monthly[monthKey].downloads++;
        stats.monthly[monthKey].total_size += sizeBytes;
        
        // Update all-time stats
        stats.all_time.total_downloads++;
        stats.all_time.total_size_bytes += sizeBytes;
        if (!stats.all_time.first_download) {
            stats.all_time.first_download = completedTime.toISOString();
        }
    } else if (isFailed) {
        stats.daily[dateKey].failed++;
        stats.weekly[weekKey].failed++;
        stats.monthly[monthKey].failed++;
        stats.all_time.total_failed++;
    }
    
    cleanupOldStatistics(stats);
    store.set('download_statistics', stats);
}

function createEmptyStats() {
    return {
        downloads: 0,
        total_size: 0,
        failed: 0,
        avg_speed: 0
    };
}

function getDateKey(date) {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

function getWeekKey(date) {
    var week = getWeekNumber(date);
    return `${date.getFullYear()}-W${week.toString().padStart(2, '0')}`;
}

function getMonthKey(date) {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
}

function getWeekNumber(date) {
    var d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    var week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

function cleanupOldStatistics(stats) {
    var now = new Date();
    var cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    Object.keys(stats.daily).forEach(function(dateKey) {
        var date = new Date(dateKey);
        if (date < cutoffDate) {
            delete stats.daily[dateKey];
        }
    });
    var weekKeys = Object.keys(stats.weekly).sort();
    if (weekKeys.length > 52) {
        weekKeys.slice(0, weekKeys.length - 52).forEach(function(key) {
            delete stats.weekly[key];
        });
    }
    var monthKeys = Object.keys(stats.monthly).sort();
    if (monthKeys.length > 24) {
        monthKeys.slice(0, monthKeys.length - 24).forEach(function(key) {
            delete stats.monthly[key];
        });
    }
}

function getDownloadStatistics(period) {
    var stats = store.get('download_statistics') || defaultSettings.download_statistics;
    var now = new Date();
    
    switch (period) {
        case 'today':
            return stats.daily[getDateKey(now)] || createEmptyStats();
        case 'week':
            return stats.weekly[getWeekKey(now)] || createEmptyStats();
        case 'month':
            return stats.monthly[getMonthKey(now)] || createEmptyStats();
        case 'all_time':
            return stats.all_time;
        default:
            return stats;
    }
}

function showNotification(title, message, type) {
    // Store the last notification to avoid duplicates
    var notificationKey = `last_notification_${type}_${title}`;
    chrome.storage.local.get([notificationKey], function(result) {
        var lastNotified = result[notificationKey] || 0;
        var now = Date.now();
        
        if (now - lastNotified < 10 * 60 * 1000) return;
        
        chrome.notifications.create({
            type: 'basic',
            iconUrl: getNotificationIcon(type),
            title: title,
            message: message
        });
        chrome.storage.local.set({ [notificationKey]: now });
    });
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'images/content_icon_success.png';
        case 'error': return 'images/content_icon_error.png';
        case 'warning': return 'images/content_icon_error.png';
        default: return 'images/content_icon.png';
    }
}

function resetSettings() {
    store.fromObject(defaultSettings);
}

function restartTimer() {
    chrome.alarms.clear('refresh');
    chrome.storage.local.get(['config_refresh_rate'], function(result) {
        if (result.config_refresh_rate !== undefined) {
            store.data.config_refresh_rate = result.config_refresh_rate;
        }
        
        // Ensure store is ready before accessing settings
        if (store.isReady) {
            startTimer();
        } else {
            store.ready(function() {
                startTimer();
            });
        }
    });
}

function startTimer() {
    var refreshRate = getRefreshRate();
    if (refreshRate > 0) {
        var minutes = refreshRate / 60000;
        chrome.alarms.create('refresh', { periodInMinutes: minutes });
    }
}

function refreshRateChanged() {
    restartTimer();
}

// Auto-pause scheduling functions
function updateScheduleStatus() {
    var schedule = store.get('auto_pause_schedule') || defaultSettings.auto_pause_schedule;
    if (!schedule.enabled) return;
    
    var now = new Date();
    var currentDay = now.getDay(); // 0=Sunday, 6=Saturday
    var currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes since midnight
    
    // Check if today is a scheduled day
    if (!schedule.days.includes(currentDay)) return;
    
    // Parse schedule times
    var pauseTimeParts = schedule.pause_time.split(':');
    var resumeTimeParts = schedule.resume_time.split(':');
    var pauseMinutes = parseInt(pauseTimeParts[0]) * 60 + parseInt(pauseTimeParts[1]);
    var resumeMinutes = parseInt(resumeTimeParts[0]) * 60 + parseInt(resumeTimeParts[1]);
    
    // Check if we need to pause or resume
    var shouldBePaused = false;
    if (pauseMinutes < resumeMinutes) {
        // Same day schedule (e.g., pause at 2:00, resume at 8:00)
        shouldBePaused = currentTime >= pauseMinutes && currentTime < resumeMinutes;
    } else {
        // Overnight schedule (e.g., pause at 22:00, resume at 6:00)
        shouldBePaused = currentTime >= pauseMinutes || currentTime < resumeMinutes;
    }
    
    // Get current pause status
    chrome.storage.local.get(['paused'], function(result) {
        var currentlyPaused = result.paused;
        var timeString = now.toTimeString().substring(0, 8);
        
        if (shouldBePaused && !currentlyPaused && schedule.last_action !== 'pause_' + timeString.substring(0, 5)) {
            // Should pause and not currently paused
            sendSabRequest({ mode: 'pause' }, function(data) {
                schedule.last_action = 'pause_' + timeString.substring(0, 5);
                store.set('auto_pause_schedule', schedule);
            });
        } else if (!shouldBePaused && currentlyPaused && schedule.last_action !== 'resume_' + timeString.substring(0, 5)) {
            // Should resume and currently paused (only if paused by schedule)
            if (schedule.last_action && schedule.last_action.startsWith('pause_')) {
                sendSabRequest({ mode: 'resume' }, function(data) {
                    schedule.last_action = 'resume_' + timeString.substring(0, 5);
                    store.set('auto_pause_schedule', schedule);
                });
            }
        }
    });
}

function calculateNextScheduleEvents() {
    var schedule = store.get('auto_pause_schedule') || defaultSettings.auto_pause_schedule;
    if (!schedule.enabled || schedule.days.length === 0) {
        return { nextPause: null, nextResume: null };
    }
    
    var now = new Date();
    var nextPause = null;
    var nextResume = null;
    
    // Check next 7 days for scheduled events
    for (var i = 0; i < 7; i++) {
        var checkDate = new Date(now);
        checkDate.setDate(checkDate.getDate() + i);
        var dayOfWeek = checkDate.getDay();
        
        if (schedule.days.includes(dayOfWeek)) {
            // Parse times for this day
            var pauseTimeParts = schedule.pause_time.split(':');
            var resumeTimeParts = schedule.resume_time.split(':');
            
            var pauseTime = new Date(checkDate);
            pauseTime.setHours(parseInt(pauseTimeParts[0]), parseInt(pauseTimeParts[1]), 0, 0);
            
            var resumeTime = new Date(checkDate);
            resumeTime.setHours(parseInt(resumeTimeParts[0]), parseInt(resumeTimeParts[1]), 0, 0);
            
            // If resume time is before pause time, it's next day
            if (resumeTime <= pauseTime) {
                resumeTime.setDate(resumeTime.getDate() + 1);
            }
            
            // Check if these events are in the future
            if (pauseTime > now && !nextPause) {
                nextPause = pauseTime;
            }
            if (resumeTime > now && !nextResume) {
                nextResume = resumeTime;
            }
        }
    }
    
    return { nextPause: nextPause, nextResume: nextResume };
}

function getScheduleStatus() {
    var schedule = store.get('auto_pause_schedule') || defaultSettings.auto_pause_schedule;
    if (!schedule.enabled) {
        return { status: 'disabled', message: 'Schedule disabled' };
    }
    
    var events = calculateNextScheduleEvents();
    var now = new Date();
    
    if (events.nextPause && events.nextResume) {
        var nextEvent = events.nextPause < events.nextResume ? events.nextPause : events.nextResume;
        var isNextPause = nextEvent === events.nextPause;
        var timeDiff = nextEvent - now;
        var hoursUntil = Math.floor(timeDiff / (1000 * 60 * 60));
        var minutesUntil = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        
        var timeString = '';
        if (hoursUntil > 0) {
            timeString = hoursUntil + 'h ' + minutesUntil + 'm';
        } else {
            timeString = minutesUntil + 'm';
        }
        
        return {
            status: 'active',
            message: 'Next ' + (isNextPause ? 'pause' : 'resume') + ' in ' + timeString,
            nextEvent: nextEvent,
            isNextPause: isNextPause
        };
    } else {
        return { status: 'warning', message: 'No upcoming scheduled events' };
    }
}

function SetupContextMenu() {
    if (store.get('config_enable_context_menu')) {
        chrome.contextMenus.create({
            id: "SABconnect",
            title: "Send to SABnzbd",
            contexts: ["link"],
            targetUrlPatterns: ["*://*/*"]
        });
    }
}


function uploadNZBToSABnzbd(nzbBlob, filename, sendResponse, category) {
    const sabApiUrl = constructApiUrl();
    const data = constructApiPost();
    data.mode = 'addfile';
    data.output = 'json';
    
    var ignoreCategories = store.get('config_ignore_categories');
    
    if (ignoreCategories === true) {
    } else {
        var hardCodedCategory = store.get('config_hard_coded_category');
        var defaultCategory = store.get('config_default_category');
        
        if (hardCodedCategory && hardCodedCategory.trim() !== '') {
            data.cat = hardCodedCategory.trim();
        } else if (category) {
            data.cat = category;
        } else if (defaultCategory && defaultCategory.trim() !== '') {
            data.cat = defaultCategory.trim();
        }
    }
    
    // Create form data
    const formData = new FormData();
    Object.keys(data).forEach(key => {
        formData.append(key, data[key]);
    });
    
    // Add the NZB file
    formData.append('nzbfile', nzbBlob, filename);
    
    const profile = activeProfile();
    const headers = {};
    if (profile.username && profile.password) {
        headers['Authorization'] = 'Basic ' + btoa(profile.username + ':' + profile.password);
    }
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    fetch(sabApiUrl, {
        method: 'POST',
        headers: headers,
        body: formData,
        signal: controller.signal
    })
    .then(response => {
        clearTimeout(timeoutId);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (sendResponse) sendResponse({ ret: 'success', data: data });
    })
    .catch(error => {
        clearTimeout(timeoutId);
        if (sendResponse) sendResponse({ ret: 'error' });
    });
    
    fetchInfo(true);
}

function addToSABnzbd(request, sendResponse) {
    var nzburl = request.nzburl;
    var mode = request.mode;
    var nzbname = request.nzbname;
    var category = request.category;
    
    var sabApiUrl = constructApiUrl();
    var data = constructApiPost();
    data.mode = mode;
    data.name = nzburl;
    data.output = 'json';
    if (nzbname) {
        data.nzbname = nzbname;
    }
    
    var ignoreCategories = store.get('config_ignore_categories');
    
    if (ignoreCategories === true) {
    } else {
        var hardCodedCategory = store.get('config_hard_coded_category');
        var defaultCategory = store.get('config_default_category');
        
        
        if (hardCodedCategory && hardCodedCategory.trim() !== '') {
            // Priority 1: Use hard-coded category
            data.cat = hardCodedCategory.trim();
        } else if (category) {
            // Priority 2: Use site category
            data.cat = category;
        } else if (defaultCategory && defaultCategory.trim() !== '') {
            // Priority 3: Use default category
            data.cat = defaultCategory.trim();
        } else {
        }
    }
    
    
    var url = new URL(sabApiUrl);
    Object.keys(data).forEach(key => url.searchParams.append(key, data[key]));
    
    var profile = activeProfile();
    var headers = {};
    if (profile.username && profile.password) {
        headers['Authorization'] = 'Basic ' + btoa(profile.username + ':' + profile.password);
    }
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    fetch(url, {
        method: 'GET',
        headers: headers,
        signal: controller.signal
    })
    .then(response => {
        clearTimeout(timeoutId);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        sendResponse({ ret: 'success', data: data });
    })
    .catch(error => {
        clearTimeout(timeoutId);
        sendResponse({ ret: 'error' });
    });
    
    fetchInfo(true);
}

function initializeProfile() {
    var firstProfileInitialized = store.get('first_profile_initialized');
    if (!firstProfileInitialized) {
        try {
            profiles.add('Default', {
                url: store.get('sabnzbd_url'),
                api_key: store.get('sabnzbd_api_key'),
                username: store.get('sabnzbd_username'),
                password: store.get('sabnzbd_password')
            });
            profiles.setActiveProfile("Default");
        } catch (e) {
            // Profile already exists or other error
        }
        store.set('first_profile_initialized', true);
        return;
    }
    
    var profile = profiles.getActiveProfile();
    if (!profile || !profile.values) {
        profile = profiles.getFirstProfile();
        if (profile) {
            profiles.setActiveProfile(profile.name);
        }
    }
}

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'initialize':
            if (request.provider) {
                var setting = 'provider_' + request.provider;
                var value = store.get(setting);
                // Special handling for newznab which stores a comma-separated list
                if (request.provider === 'newznab' && typeof value === 'string') {
                    sendResponse({ response: request.action, enabled: value.length > 0 });
                } else {
                    sendResponse({ response: request.action, enabled: value });
                }
            }
            break;
        case 'set_setting':
            store.set(request.setting, request.value);
            sendResponse({ response: request.action, value: true });
            break;
        case 'get_setting':
            sendResponse({ response: request.action, value: store.get(request.setting) });
            break;
        case 'addToSABnzbd':
            addToSABnzbd(request, sendResponse);
            return true;
        case 'contextMenuAddUrl':
            // Handle context menu URL with authentication (fallback)
            addToSABnzbd({ 
                nzburl: request.url, 
                mode: 'addurl' 
            }, function(response) {
                // Handle response if needed
            });
            break;
        case 'uploadNZBFile':
            // Handle NZB file upload from content script
            const binaryString = atob(request.fileData);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const nzbBlob = new Blob([bytes], { type: 'application/x-nzb' });
            
            // Upload to SABnzbd
            uploadNZBToSABnzbd(nzbBlob, request.filename, sendResponse, request.category);
            return true;
        case 'get_categories':
            var params = { mode: 'get_cats' };
            sendSabRequest(params, sendResponse);
            return true;
        case 'refresh':
            refresh();
            sendResponse({ success: true });
            break;
        case 'setMaxSpeed':
            setMaxSpeed(request.speed, 
                function(data) { 
                    sendResponse({ success: true }); 
                },
                function(error) { 
                    sendResponse({ success: false }); 
                }
            );
            return true;
        case 'getMaxSpeed':
            getMaxSpeed(function(data) {
                sendResponse({ success: true, data: data });
            }, function(error) {
                sendResponse({ success: false, error: error });
            });
            return true;
        case 'testConnection':
            testConnection(request.profileValues, function(result) {
                // Check if there was an error
                chrome.storage.local.get(['error'], function(storage) {
                    var hasError = storage.error && storage.error !== '';
                    sendResponse({ 
                        success: !hasError,
                        error: storage.error || null
                    });
                });
            });
            return true;
        case 'resetSettings':
            resetSettings();
            sendResponse({ success: true });
            break;
        case 'restartTimer':
            restartTimer();
            sendResponse({ success: true });
            break;
        case 'setupContextMenu':
            SetupContextMenu();
            sendResponse({ success: true });
            break;
        case 'refreshRateChanged':
            refreshRateChanged();
            sendResponse({ success: true });
            break;
        case 'profileChanged':
            settingsChanging = true;
            
            chrome.alarms.clear('refresh');
            
            if (request.profileName) {
                profiles.setActiveProfile(request.profileName);
            }
            
            chrome.storage.local.remove(['last_successful_data', 'last_successful_profile', 'last_successful_timestamp', 'queue_info', 'status', 'speed', 'sizeleft', 'queue', 'error', 'paused', 'timeleft', 'speedlog']);
            
            setTimeout(function() {
                settingsChanging = false;
                currentProfileForRefresh = request.profileName;
                refresh(false, function() {
                    startTimer();
                    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                        if (tabs[0]) {
                            chrome.tabs.sendMessage(tabs[0].id, {action: 'refresh_popup'});
                        }
                    });
                });
            }, 100);
            
            sendResponse({ success: true });
            break;
        case 'settings_changed':
            // Set flag to prevent old alarms from firing
            settingsChanging = true;
            
            // Cancel the current refresh timer
            chrome.alarms.clear('refresh');
            // Reload ALL settings from storage before refreshing
            chrome.storage.local.get(null, function(allSettings) {
                    // Update the store data with all settings
                store.data = { ...store.defaults, ...allSettings };
                    
                // Trigger immediate refresh to reflect new settings
                refresh(false, function() {
                            
                    // Ensure store is ready before accessing settings
                    if (store.isReady) {
                        startTimer();
                                    settingsChanging = false;
                                } else {
                                    store.ready(function() {
                                            startTimer();
                                settingsChanging = false;
                                        });
                    }
                });
            }); // End of chrome.storage.local.get
            sendResponse({ success: true });
            break;
        case 'getStatistics':
            var period = request.period || 'today';
            // Fetch statistics from SABnzbd API
            fetchStatisticsFromSAB(period, function(stats) {
                sendResponse({ 
                    success: true, 
                    statistics: stats
                });
            });
            return true; // Indicate async response
        case 'getHistory':
            var limit = request.limit || 10;
            // Use the correct SABnzbd history API according to documentation
            var params = { 
                mode: 'history',
                start: 0,
                limit: limit,
                archive: 1  // Include archived/completed downloads
            };
            sendSabRequest(params, 
                function(data) {
                    sendResponse({ success: true, history: data });
                },
                function(error) {
                    console.error('SABnzbd history error:', error);
                    sendResponse({ success: false, error: error });
                }
            );
            return true;
        case 'toggleQueue':
            var mode = request.mode; // 'pause' or 'resume'
            sendSabRequest({ mode: mode }, 
                function(data) {
                    sendResponse({ success: true, data: data });
                },
                function(error) {
                    sendResponse({ success: false, error: error });
                }
            );
            return true;
        case 'getScheduleStatus':
            sendResponse({ 
                success: true, 
                status: getScheduleStatus()
            });
            break;
        case 'updateSchedule':
            var schedule = store.get('auto_pause_schedule') || defaultSettings.auto_pause_schedule;
            if (request.schedule) {
                Object.assign(schedule, request.schedule);
                store.set('auto_pause_schedule', schedule);
                sendResponse({ success: true });
            } else {
                sendResponse({ success: false, error: 'No schedule data provided' });
            }
            break;
        case 'getSchedule':
            sendResponse({ 
                success: true, 
                schedule: store.get('auto_pause_schedule') || defaultSettings.auto_pause_schedule
            });
            break;
        case 'shutdownSAB':
            sendSabRequest({ mode: 'shutdown' }, 
                function(data) {
                    sendResponse({ success: true, data: data });
                },
                function(error) {
                    sendResponse({ success: false, error: error });
                }
            );
            return true;
        case 'restartSAB':
            sendSabRequest({ mode: 'restart' }, 
                function(data) {
                    sendResponse({ success: true, data: data });
                },
                function(error) {
                    sendResponse({ success: false, error: error });
                }
            );
            return true;
    }
});

// Global flag to prevent old timer from firing during settings change
var settingsChanging = false;
var currentProfileForRefresh = null;

// Alarm handler
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'refresh' && !settingsChanging) {
        refresh();
    } else if (settingsChanging) {
    }
});

// Context menu handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "SABconnect" && info.linkUrl) {
        // Check if this is a Newznab URL that needs authentication processing
        const newznab_urls_pre = store.get('provider_newznab');
        if (newznab_urls_pre && newznab_urls_pre.length > 0) {
            const newznab_urls = newznab_urls_pre.split(',').map(url => url.trim());
            const linkUrl = new URL(info.linkUrl);
            
            // Check if the URL matches any configured Newznab providers
            const isNewznabUrl = newznab_urls.some(newznab_url => {
                return linkUrl.hostname.includes(newznab_url) || 
                       linkUrl.hostname === newznab_url ||
                       info.linkUrl.includes(newznab_url);
            });
            
            if (isNewznabUrl) {
                // For Newznab URLs, download the file from content script context (has cookies)
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: (originalUrl) => {
                        // Fix nzbstars.com URLs that have wrong page parameter
                        if (originalUrl.includes('nzbstars.com') && originalUrl.includes('page=getspot')) {
                            const url = new URL(originalUrl);
                            url.searchParams.set('page', 'getnzb');
                            url.searchParams.set('action', 'display');
                            originalUrl = url.toString();
                        }
                        
                        // Download the NZB file using fetch (has access to cookies)
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for file downloads
                        
                        fetch(originalUrl, { signal: controller.signal })
                            .then(response => {
                                clearTimeout(timeoutId);
                                if (!response.ok) {
                                    throw new Error(`HTTP error! status: ${response.status}`);
                                }
                                
                                const responseHeaders = response.headers;
                                return response.text().then(text => ({ text, responseHeaders }));
                            })
                            .then(({ text, responseHeaders }) => {
                                // Validate that this is actually an NZB file
                                if (!text.includes('<?xml') && !text.includes('<nzb')) {
                                    throw new Error('Downloaded content is not a valid NZB file');
                                }
                                
                                if (text.includes('<html') || text.includes('<HTML')) {
                                    throw new Error('Downloaded content is an HTML page, not an NZB file');
                                }
                                
                                // Extract filename from various sources
                                let nzbFilename = 'download.nzb';
                                
                                // Try to get filename from Content-Disposition header
                                const contentDisposition = responseHeaders.get('content-disposition');
                                if (contentDisposition) {
                                    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                                    if (filenameMatch && filenameMatch[1]) {
                                        nzbFilename = filenameMatch[1].replace(/['"]/g, '');
                                    }
                                }
                                
                                // Try to extract from NZB XML content
                                if (nzbFilename === 'download.nzb') {
                                    const fileMatch = text.match(/<file[^>]*subject="([^"]*)"[^>]*>/);
                                    if (fileMatch && fileMatch[1]) {
                                        nzbFilename = fileMatch[1]
                                            .replace(/[<>:"/\\|?*]/g, '_')
                                            .replace(/^Re:\s*/i, '')
                                            .substring(0, 100)
                                            .trim();
                                        if (!nzbFilename.endsWith('.nzb')) {
                                            nzbFilename += '.nzb';
                                        }
                                    }
                                }
                                
                                // Fallback: try to extract from URL (for nzbstars.com messageid)
                                if (nzbFilename === 'download.nzb') {
                                    const urlParts = originalUrl.split('?');
                                    if (urlParts.length > 1) {
                                        const urlParams = new URLSearchParams(urlParts[1]);
                                        const messageId = urlParams.get('messageid');
                                        if (messageId) {
                                            nzbFilename = `nzbstars_${messageId.replace(/[<>:"/\\|?*@]/g, '_')}.nzb`;
                                        }
                                    }
                                }
                                
                                // Convert to blob for upload
                                const blob = new Blob([text], { type: 'application/x-nzb' });
                                
                                // Convert blob to base64 for transmission to service worker
                                const reader = new FileReader();
                                reader.onload = function() {
                                    const base64data = reader.result.split(',')[1];
                                    
                                    // Send the NZB file data to service worker
                                    chrome.runtime.sendMessage({
                                        action: 'uploadNZBFile',
                                        fileData: base64data,
                                        filename: nzbFilename
                                    });
                                };
                                reader.readAsDataURL(blob);
                            })
                            .catch(error => {
                                clearTimeout(timeoutId);
                                // Fallback: try to authenticate and send URL
                                var uid = null, rsstoken = null, queryString = '';
                                
                                var uidInput = document.querySelector('[name=UID]');
                                var rsstokenInput = document.querySelector('[name=RSSTOKEN]');
                                if (uidInput && uidInput.value) uid = uidInput.value;
                                if (rsstokenInput && rsstokenInput.value) rsstoken = rsstokenInput.value;
                                
                                if (uid && rsstoken) {
                                    queryString = '?i=' + uid + '&r=' + rsstoken + '&del=1';
                                }
                                
                                var finalUrl = queryString ? originalUrl + queryString : originalUrl;
                                
                                chrome.runtime.sendMessage({
                                    action: 'contextMenuAddUrl',
                                    url: finalUrl
                                });
                            });
                    },
                    args: [info.linkUrl]
                });
                return;
            }
        }
        
        // For non-Newznab URLs, use direct approach
        addToSABnzbd({ 
            nzburl: info.linkUrl, 
            mode: 'addurl' 
        }, function(response) {
            // Handle response if needed
        });
    }
});

// Fetch statistics from SABnzbd API
function fetchStatisticsFromSAB(period, callback) {
    try {
        var params = { mode: 'server_stats' };
        
        sendSabRequest(params, 
            function(data) {
                try {
                    if (data && typeof data === 'object') {
                        var stats = {
                            downloads: 0,
                            total_size: 0,
                            failed: 0
                        };
                        
                        // The API returns simple numeric values for bytes downloaded
                        // No download counts are provided, only total bytes
                        if (period === 'all') {
                            // Return all statistics in a single response
                            stats = {
                                day: parseFloat(data.day) || 0,
                                month: parseFloat(data.month) || 0,
                                total: parseFloat(data.total) || 0
                            };
                        } else {
                            switch (period) {
                                case 'today':
                                    if (data.day !== undefined) {
                                        stats.downloads = '-'; // Count not available
                                        stats.total_size = parseFloat(data.day) || 0;
                                    }
                                    break;
                                case 'month':
                                    if (data.month !== undefined) {
                                        stats.downloads = '-'; // Count not available
                                        stats.total_size = parseFloat(data.month) || 0;
                                    }
                                    break;
                                case 'all_time':
                                default:
                                    if (data.total !== undefined) {
                                        stats.downloads = '-'; // Count not available
                                        stats.total_size = parseFloat(data.total) || 0;
                                    }
                                    break;
                            }
                        }
                        
                        callback(stats);
                    } else {
                        // Fallback to local statistics if API response is invalid
                        callback(getDownloadStatistics(period));
                    }
                } catch (parseError) {
                    console.error('Error parsing server stats:', parseError);
                    callback(getDownloadStatistics(period));
                }
            },
            function(error) {
                console.error('Error fetching server stats:', error);
                // Fallback to local statistics on error
                callback(getDownloadStatistics(period));
            }
        );
    } catch (error) {
        console.error('Error in fetchStatisticsFromSAB:', error);
        // Ensure callback is always called
        callback(getDownloadStatistics(period));
    }
}

// Newznab dynamic content script injection
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        try {
            let found_nab = false;
            const newznab_urls_pre = await store.get('provider_newznab');
            
            if (!newznab_urls_pre || typeof newznab_urls_pre !== 'string') {
                return;
            }
            
            const newznab_urls = newznab_urls_pre.split(',').map(url => url.trim()).filter(url => url.length > 0);
            const parsedUrl = new URL(tab.url);
            const host = parsedUrl.hostname.match(/([^.]+)\.\w{2,3}(?:\.\w{2})?$/)?.[0] || parsedUrl.hostname;
            
            // Check if this is a configured Newznab site
            for (const newznab_url of newznab_urls) {
                const matchesUrl = tab.url.includes(newznab_url);
                const matchesHostname = parsedUrl.hostname.includes(newznab_url);
                const matchesExactHostname = parsedUrl.hostname === newznab_url;
                
                if (matchesUrl || matchesHostname || matchesExactHostname) {
                            // Inject scripts for Newznab
                    await chrome.scripting.executeScript({
                        target: { tabId: tabId, allFrames: true },
                        files: [
                            "third_party/jquery/jquery-1.12.4.min.js",
                            "scripts/content/common.js",
                            "third_party/webtoolkit/webtoolkit.base64.js",
                            "scripts/content/newznab.js"
                        ]
                    });
                    
                    await chrome.scripting.insertCSS({
                        target: { tabId: tabId },
                        files: ["css/newznab.css"]
                    });
                    
                    const nabIgnoreKey = `nabignore.${host}`;
                    const nabIgnored = await store.get(nabIgnoreKey);
                    if (nabIgnored === false) {
                        await store.set(nabIgnoreKey, true);
                    }
                    
                    found_nab = true;
                    break;
                }
            }
            
            // Auto-detection for new Newznab sites
            if (!found_nab && tab.url.startsWith('http')) {
                const nabIgnoreKey = `nabignore.${host}`;
                const nabenabled = await store.get(nabIgnoreKey);
                const nabdetection = await store.get('config_enable_automatic_detection');
                
                if (nabdetection && !nabenabled) {
                    await chrome.scripting.executeScript({
                        target: { tabId: tabId },
                        files: [
                            "third_party/jquery/jquery-1.12.4.min.js",
                            "third_party/jquery/jquery.notify.js",
                            "scripts/content/common.js",
                            "scripts/pages/newznab-autoadd.js"
                        ]
                    });
                    
                    await chrome.scripting.insertCSS({
                        target: { tabId: tabId },
                        files: ["css/nabnotify.css"]
                    });
                }
                
                if (nabenabled === false) {
                    await store.set(nabIgnoreKey, true);
                }
            }
        } catch (error) {
            // Silently fail - this could happen if we don't have permission for the tab
            console.debug('Error injecting Newznab scripts:', error);
        }
    }
});

// Initialize when service worker starts
store.init(function() {
    initializeProfile();
    startTimer();
    SetupContextMenu();
});