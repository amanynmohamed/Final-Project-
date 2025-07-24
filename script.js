// Global sentiment analyzer instance
let sentimentAnalyzer = null;

// Initialize Puzzle Game on page load
document.addEventListener("DOMContentLoaded", async function() {
    initializePuzzleGame();
    initializeAccessibilityFeatures();
    
    // Initialize AI sentiment analysis
    if (window.SentimentAnalyzer) {
        sentimentAnalyzer = new SentimentAnalyzer();
        await sentimentAnalyzer.initialize();
    }
});

// Dark Mode and Accessibility Features
function initializeAccessibilityFeatures() {
    // Initialize dark mode
    initializeDarkMode();
    
    // Initialize feedback collection
    initializeFeedbackCollection();
    
    // Initialize usage tracking
    initializeUsageTracking();
}

function initializeDarkMode() {
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const body = document.body;
    
    // Load saved dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
        body.classList.add('dark-mode');
        darkModeToggle.textContent = '☀️ Light Mode';
    }
    
    // Dark mode toggle functionality
    darkModeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        const isDarkMode = body.classList.contains('dark-mode');
        
        // Update button text
        darkModeToggle.textContent = isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
        
        // Save preference
        localStorage.setItem('darkMode', isDarkMode);
        
        // Track usage
        trackUsage('darkMode', isDarkMode ? 'enabled' : 'disabled');
    });
}

function initializeFeedbackCollection() {
    // Add feedback collection after puzzle completion
    const originalShowRandomAffirmation = window.showRandomAffirmation;
    
    window.showRandomAffirmation = function(prefix = "", isWinMessage = false, targetElement = null) {
        const result = originalShowRandomAffirmation.call(this, prefix, isWinMessage, targetElement);
        
        if (isWinMessage) {
            // Add anonymous feedback form after completion
            setTimeout(() => {
                addAnonymousFeedback();
            }, 15000);
        }
        
        return result;
    };
}

function addAnonymousFeedback() {
    const messageDiv = document.getElementById('message');
    if (!messageDiv || messageDiv.classList.contains('hidden')) return;
    
    const feedbackDiv = document.createElement('div');
    feedbackDiv.className = 'feedback-form';
    feedbackDiv.innerHTML = `
        <div style="margin-top: 20px; padding: 15px; background: #f0f8f0; border: 1px solid #c8e6c9; border-radius: 8px; text-align: center;">
            <p style="margin: 0 0 10px 0; font-size: 0.9em; color: #2e7d32;">
                <strong>Quick Feedback (Anonymous)</strong><br>
                How did this puzzle session feel?
            </p>
            <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                <button onclick="submitFeedback('helpful')" style="padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8em;">
                    😊 Helpful
                </button>
                <button onclick="submitFeedback('calming')" style="padding: 8px 16px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8em;">
                    😌 Calming
                </button>
                <button onclick="submitFeedback('challenging')" style="padding: 8px 16px; background: #FF9800; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8em;">
                    🤔 Challenging
                </button>
                <button onclick="submitFeedback('skip')" style="padding: 8px 16px; background: #9E9E9E; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8em;">
                    Skip
                </button>
            </div>
        </div>
    `;
    
    messageDiv.appendChild(feedbackDiv);
}

async function submitFeedback(type) {
    // Store feedback anonymously
    const feedback = {
        type: type,
        timestamp: new Date().toISOString(),
        puzzle: getCurrentPuzzleInfo()
    };
    
    // Save to localStorage for aggregate analysis
    const existingFeedback = JSON.parse(localStorage.getItem('anonymousFeedback') || '[]');
    existingFeedback.push(feedback);
    localStorage.setItem('anonymousFeedback', JSON.stringify(existingFeedback));
    
    // Remove feedback form
    const feedbackForm = document.querySelector('.feedback-form');
    if (feedbackForm) {
        feedbackForm.style.opacity = '0';
        setTimeout(() => feedbackForm.remove(), 300);
    }
    
    // Use AI sentiment analysis for personalized response
    if (sentimentAnalyzer && type !== 'skip') {
        await showAIPersonalizedResponse(type, existingFeedback);
    } else {
        // Show standard thank you message
        if (type !== 'skip') {
            const thankYouDiv = document.createElement('div');
            thankYouDiv.innerHTML = `
                <div style="margin-top: 10px; padding: 10px; background: #e8f5e8; border-radius: 6px; text-align: center; font-size: 0.9em; color: #2e7d32;">
                    Thank you for your feedback! 🙏
                </div>
            `;
            document.getElementById('message').appendChild(thankYouDiv);
            
            setTimeout(() => {
                thankYouDiv.style.opacity = '0';
                setTimeout(() => thankYouDiv.remove(), 300);
            }, 4000);
        }
    }
    
    // Track usage
    trackUsage('feedback', type);
}

// AI-powered personalized response system
async function showAIPersonalizedResponse(feedbackType, allFeedback) {
    try {
        // Analyze sentiment from recent feedback
        const sentimentAnalysis = await sentimentAnalyzer.analyzeFeedbackSentiment(allFeedback);
        
        // Generate personalized affirmation based on sentiment
        const personalizedAffirmation = await sentimentAnalyzer.generatePersonalizedAffirmation(sentimentAnalysis);
        
        // Show the AI-generated response
        const responseDiv = document.createElement('div');
        responseDiv.innerHTML = `
            <div style="margin-top: 10px; padding: 12px; background: linear-gradient(135deg, #e8f5e8 0%, #f0f8ff 100%); border-radius: 8px; text-align: center; font-size: 0.9em; color: #2e7d32; border: 1px solid #c8e6c9;">
                <div style="font-weight: 500; margin-bottom: 5px;">${personalizedAffirmation}</div>
                <div style="font-size: 0.75em; color: #666; margin-top: 8px;">
                    ${sentimentAnalysis.source === 'ai' ? '🤖 AI-personalized' : '🌱 Care-based'} response
                </div>
            </div>
        `;
        
        document.getElementById('message').appendChild(responseDiv);
        
        // Remove after 6 seconds (longer for personalized content)
        setTimeout(() => {
            responseDiv.style.opacity = '0';
            setTimeout(() => responseDiv.remove(), 300);
        }, 6000);
        
    } catch (error) {
        console.error('AI personalized response failed:', error);
        // Fallback to standard message
        const thankYouDiv = document.createElement('div');
        thankYouDiv.innerHTML = `
            <div style="margin-top: 10px; padding: 10px; background: #e8f5e8; border-radius: 6px; text-align: center; font-size: 0.9em; color: #2e7d32;">
                Thank you for your feedback! 🙏
            </div>
        `;
        document.getElementById('message').appendChild(thankYouDiv);
        
        setTimeout(() => {
            thankYouDiv.style.opacity = '0';
            setTimeout(() => thankYouDiv.remove(), 300);
        }, 4000);
    }
}

function initializeUsageTracking() {
    // Track puzzle completion rates
    const originalCheckWinCondition = window.checkWinCondition;
    
    window.checkWinCondition = function() {
        const result = originalCheckWinCondition.call(this);
        
        if (result) {
            trackUsage('puzzleCompleted', getCurrentPuzzleInfo());
        }
        
        return result;
    };
}

function trackUsage(event, data) {
    const usage = {
        event: event,
        data: data,
        timestamp: new Date().toISOString()
    };
    
    // Store usage data for analysis
    const existingUsage = JSON.parse(localStorage.getItem('usageData') || '[]');
    existingUsage.push(usage);
    
    // Keep only last 100 entries to avoid storage bloat
    if (existingUsage.length > 100) {
        existingUsage.splice(0, existingUsage.length - 100);
    }
    
    localStorage.setItem('usageData', JSON.stringify(existingUsage));
}

function getCurrentPuzzleInfo() {
    return {
        mode: window.currentMode || 'unknown',
        difficulty: window.currentDifficulty || '3x3',
        wordSet: window.currentWordSets ? window.currentWordSets[window.currentMode] : 0
    };
}

// Enhanced accessibility - keyboard navigation
document.addEventListener('keydown', (e) => {
    // Escape key to close instructions
    if (e.key === 'Escape') {
        const instructions = document.getElementById('instructions');
        if (instructions && !instructions.classList.contains('hidden')) {
            instructions.classList.add('hidden');
        }
    }
    
    // Space bar for quick boost
    if (e.key === ' ' && !e.target.matches('input, textarea, select')) {
        e.preventDefault();
        const quickBoostBtn = document.getElementById('quick-boost-button');
        if (quickBoostBtn) {
            quickBoostBtn.click();
        }
    }
});

// Accessibility improvements for screen readers
function addAriaLabels() {
    const puzzleContainer = document.getElementById('puzzle-container');
    if (puzzleContainer) {
        puzzleContainer.setAttribute('role', 'grid');
        puzzleContainer.setAttribute('aria-label', 'Puzzle grid - click pieces to select and swap them');
    }
    
    const pieces = document.querySelectorAll('.puzzle-piece');
    pieces.forEach((piece, index) => {
        piece.setAttribute('role', 'gridcell');
        piece.setAttribute('tabindex', '0');
        piece.setAttribute('aria-label', `Puzzle piece ${index + 1} containing ${piece.textContent}`);
    });
}

// Usage Analytics Functions - Available globally for developer access
window.getUsageData = function() {
    const usageData = JSON.parse(localStorage.getItem('usageData') || '[]');
    const feedbackData = JSON.parse(localStorage.getItem('anonymousFeedback') || '[]');
    
    return {
        totalSessions: usageData.length,
        completedPuzzles: usageData.filter(u => u.event === 'puzzleCompleted').length,
        darkModeUsage: usageData.filter(u => u.event === 'darkMode').length,
        feedback: feedbackData,
        recentActivity: usageData.slice(-10),
        completionRate: usageData.filter(u => u.event === 'puzzleCompleted').length / Math.max(1, usageData.length) * 100
    };
};

window.showUsageReport = function() {
    const data = window.getUsageData();
    const report = `
=== Inner Bloom Usage Analytics ===

Total Sessions: ${data.totalSessions}
Completed Puzzles: ${data.completedPuzzles}
Completion Rate: ${data.completionRate.toFixed(1)}%
Dark Mode Toggles: ${data.darkModeUsage}

=== User Feedback ===
Total Feedback: ${data.feedback.length}
${data.feedback.reduce((acc, f) => {
    acc[f.type] = (acc[f.type] || 0) + 1;
    return acc;
}, {})}

=== Recent Activity ===
${data.recentActivity.map(a => `${a.event}: ${JSON.stringify(a.data)}`).join('\n')}

Use getUsageData() for detailed data access.
    `;
    
    console.log(report);
    return data;
};

// Add keyboard shortcut to view usage (Ctrl+U)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        window.showUsageReport();
    }
});

// Add a simple UI button to view usage data
function addUsageViewButton() {
    const controlsDiv = document.querySelector('.controls');
    if (controlsDiv) {
        const usageBtn = document.createElement('button');
        usageBtn.id = 'usage-view-button';
        usageBtn.textContent = '📊 Usage Data';
        usageBtn.style.cssText = 'font-size: 0.85em; padding: 8px 12px;';
        usageBtn.addEventListener('click', () => {
            showUsageModal();
        });
        controlsDiv.appendChild(usageBtn);
    }
}

function showUsageModal() {
    const data = window.getUsageData();
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.5); display: flex; align-items: center; 
        justify-content: center; z-index: 1000;
    `;
    
    const feedbackSummary = data.feedback.reduce((acc, f) => {
        acc[f.type] = (acc[f.type] || 0) + 1;
        return acc;
    }, {});
    
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; max-height: 80vh; overflow-y: auto;">
            <h2 style="margin-top: 0; color: #00796b;">Usage Analytics</h2>
            
            <div style="margin-bottom: 20px;">
                <h3>Session Statistics</h3>
                <p><strong>Total Sessions:</strong> ${data.totalSessions}</p>
                <p><strong>Completed Puzzles:</strong> ${data.completedPuzzles}</p>
                <p><strong>Completion Rate:</strong> ${data.completionRate.toFixed(1)}%</p>
                <p><strong>Dark Mode Usage:</strong> ${data.darkModeUsage} toggles</p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3>User Feedback (${data.feedback.length} responses)</h3>
                ${Object.entries(feedbackSummary).map(([type, count]) => 
                    `<p><strong>${type}:</strong> ${count}</p>`
                ).join('')}
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3>Recent Activity</h3>
                ${data.recentActivity.slice(-5).map(a => 
                    `<p style="font-size: 0.8em; color: #666;">${a.event}: ${JSON.stringify(a.data)}</p>`
                ).join('')}
            </div>
            
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="background: #00796b; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                Close
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on click outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Initialize usage view button after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        addUsageViewButton();
    }, 1000);
});

// Content sets for different therapeutic puzzle modes
const puzzleContent = {
    numbers: [['1', '2', '3', '4', '5', '6', '7', '8', '9']],
    letters: [['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']],
    imageNature: [
        ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
        ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
        ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
        ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
        ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
        ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
        ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
        ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
        ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
        ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
        ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
        ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
        ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
        ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
        ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
        ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
        ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
        ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
        ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
        ['1', '2', '3', '4', '5', '6', '7', '8', '9']
    ],
    positiveWords: [
        ['CALM', 'FREE', 'GOOD', 'HOPE', 'JOY', 'KIND', 'LOVE', 'PEACE', 'WISE'],
        ['HAPPY', 'GLAD', 'CHEER', 'SMILE', 'LAUGH', 'SHINE', 'GLOW', 'LIGHT', 'PURE'],
        ['SWEET', 'NICE', 'GREAT', 'SUPER', 'COOL', 'NEAT', 'FUN', 'BEST', 'TOP'],
        ['FAITH', 'TRUST', 'HONOR', 'WORTH', 'PRIDE', 'GRACE', 'CHARM', 'MAGIC', 'GIFT'],
        ['BLISS', 'MERRY', 'SUNNY', 'WARM', 'COZY', 'SOFT', 'RICH', 'LUCKY', 'SAFE']
    ],
    natureWords: [
        ['BLOOM', 'EARTH', 'LEAF', 'MOON', 'RAIN', 'RIVER', 'SKY', 'SUN', 'TREE'],
        ['OCEAN', 'BEACH', 'WAVE', 'CLOUD', 'WIND', 'STONE', 'HILL', 'GRASS', 'ROSE'],
        ['LAKE', 'FIELD', 'BIRD', 'BEE', 'STAR', 'SNOW', 'DEW', 'MIST', 'DAWN'],
        ['PINE', 'OAK', 'BROOK', 'POND', 'CREEK', 'SHORE', 'SAND', 'ROCK', 'CAVE'],
        ['PETAL', 'SEED', 'ROOT', 'STEM', 'FRUIT', 'BERRY', 'HERB', 'MOSS', 'FERN']
    ],
    emotionWords: [
        ['CALM', 'FREE', 'GLAD', 'HAPPY', 'LIGHT', 'LOVED', 'PROUD', 'SAFE', 'WARM'],
        ['PEACE', 'JOY', 'HOPE', 'TRUST', 'FAITH', 'GRACE', 'KIND', 'SWEET', 'PURE'],
        ['BRAVE', 'BOLD', 'SURE', 'FIRM', 'TOUGH', 'SOLID', 'TRUE', 'REAL', 'DEEP'],
        ['SOFT', 'MILD', 'QUIET', 'STILL', 'CLEAR', 'OPEN', 'AWARE', 'WISE', 'COOL'],
        ['SUNNY', 'GLOW', 'SHINE', 'SPARK', 'MAGIC', 'DREAM', 'WISH', 'BLISS', 'AWE']
    ],
    actionWords: [
        ['BLOOM', 'FLOW', 'GROW', 'HEAL', 'LEARN', 'REST', 'SHINE', 'SMILE', 'WALK'],
        ['BUILD', 'MAKE', 'CRAFT', 'SHAPE', 'FORM', 'MOLD', 'PAINT', 'DRAW', 'WRITE'],
        ['DANCE', 'SING', 'PLAY', 'LAUGH', 'CHEER', 'CLAP', 'HUG', 'KISS', 'LOVE'],
        ['THINK', 'DREAM', 'HOPE', 'WISH', 'PLAN', 'SEEK', 'FIND', 'TRY', 'DO'],
        ['HELP', 'GIVE', 'SHARE', 'CARE', 'TEND', 'MEND', 'FIX', 'CURE', 'SAVE']
    ],
    mindfulWords: [
        ['AWARE', 'CLEAR', 'DEEP', 'FOCUS', 'HERE', 'NOW', 'OPEN', 'QUIET', 'STILL'],
        ['PAUSE', 'SLOW', 'CALM', 'PEACE', 'REST', 'EASE', 'SOFT', 'MILD', 'COOL'],
        ['WATCH', 'SEE', 'LOOK', 'FEEL', 'SENSE', 'KNOW', 'WISE', 'LEARN', 'GROW'],
        ['HEART', 'SOUL', 'MIND', 'SELF', 'CORE', 'ROOT', 'BASE', 'FIRM', 'TRUE'],
        ['FLOW', 'DRIFT', 'FLOAT', 'GLIDE', 'MOVE', 'SWAY', 'BEND', 'FLEX', 'YIELD']
    ],
    strengthWords: [
        ['BOLD', 'BRAVE', 'FIRM', 'POWER', 'PROUD', 'REAL', 'SOLID', 'TOUGH', 'TRUE'],
        ['CARRY', 'DRIVE', 'FORCE', 'HOLD', 'LIFT', 'MIGHT', 'PULL', 'PUSH', 'WILL'],
        ['STEEL', 'IRON', 'ROCK', 'STONE', 'WALL', 'TOWER', 'MOUNT', 'PEAK', 'CROWN'],
        ['LION', 'TIGER', 'BEAR', 'EAGLE', 'HAWK', 'WOLF', 'SHARK', 'OX', 'BULL'],
        ['FIGHT', 'WIN', 'BEAT', 'RISE', 'CLIMB', 'REACH', 'GRASP', 'HOLD', 'KEEP']
    ],
    comfortWords: [
        ['CALM', 'COZY', 'EASE', 'MILD', 'PEACE', 'REST', 'SAFE', 'SOFT', 'WARM'],
        ['SNUG', 'COMFY', 'SWEET', 'COOL', 'NICE', 'SILK', 'CLOUD', 'PILLOW', 'BED'],
        ['HOME', 'NEST', 'COUCH', 'CHAIR', 'LAP', 'ARMS', 'HUG', 'KISS', 'LOVE'],
        ['TEA', 'SOUP', 'BREAD', 'HONEY', 'MILK', 'CREAM', 'CAKE', 'PIE', 'SWEET'],
        ['BATH', 'SPA', 'POOL', 'BEACH', 'SUN', 'SHADE', 'COOL', 'MIST', 'DEW']
    ],
    gratefulWords: [
        ['BLESS', 'FAVOR', 'GIFT', 'GRACE', 'HONOR', 'LUCKY', 'PRIZE', 'THANK', 'VALUE'],
        ['PRAISE', 'CHEER', 'JOY', 'GLAD', 'HAPPY', 'SMILE', 'LOVE', 'CARE', 'KIND'],
        ['CHARM', 'MAGIC', 'GOLD', 'GEM', 'JEWEL', 'PEARL', 'CROWN', 'STAR', 'SHINE'],
        ['SWEET', 'NICE', 'GOOD', 'GREAT', 'SUPER', 'BEST', 'TOP', 'FINE', 'RICH'],
        ['HEART', 'SOUL', 'MIND', 'LIFE', 'LOVE', 'HOPE', 'FAITH', 'TRUST', 'PEACE']
    ],
    healingWords: [
        ['CLEAN', 'CURE', 'FRESH', 'HEAL', 'MEND', 'NEW', 'PURE', 'WELL', 'WHOLE'],
        ['FIX', 'PATCH', 'SEW', 'GLUE', 'BOND', 'JOIN', 'UNITE', 'MERGE', 'BLEND'],
        ['GROW', 'BLOOM', 'BUD', 'LEAF', 'ROOT', 'STEM', 'SEED', 'FRUIT', 'ROSE'],
        ['LIGHT', 'SUN', 'DAWN', 'DAY', 'CLEAR', 'SHINE', 'GLOW', 'WARM', 'SOFT'],
        ['WATER', 'RAIN', 'DEW', 'MIST', 'FLOW', 'RIVER', 'OCEAN', 'WAVE', 'POOL']
    ],
    hopeWords: [
        ['DAWN', 'DREAM', 'FLY', 'GLOW', 'HOPE', 'LIGHT', 'RISE', 'SHINE', 'SOAR'],
        ['WISH', 'PRAY', 'SEEK', 'FIND', 'LOOK', 'SEE', 'VIEW', 'SPOT', 'AIM'],
        ['CLIMB', 'REACH', 'TOUCH', 'GRASP', 'HOLD', 'KEEP', 'SAVE', 'WIN', 'BEAT'],
        ['NEW', 'FRESH', 'START', 'BEGIN', 'OPEN', 'DOOR', 'PATH', 'WAY', 'ROAD'],
        ['STAR', 'MOON', 'SUN', 'SKY', 'CLOUD', 'ANGEL', 'WING', 'PEACE', 'JOY']
    ]
};

// Track current word set for each theme
let currentWordSets = {};

// Initialize word set trackers
Object.keys(puzzleContent).forEach(theme => {
    currentWordSets[theme] = 0;
});

// Nature image using a beautiful forest scene
function createNatureImageSVG() {
    return `
    <svg viewBox="0 0 270 270" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
        <defs>
            <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="60%">
                <stop offset="0%" style="stop-color:#87CEEB;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#E0F6FF;stop-opacity:1" />
            </linearGradient>
            <linearGradient id="mountainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#B0C4DE;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#778899;stop-opacity:1" />
            </linearGradient>
            <linearGradient id="forestGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#228B22;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#006400;stop-opacity:1" />
            </linearGradient>
        </defs>
        
        <!-- Sky background -->
        <rect width="270" height="160" fill="url(#skyGradient)"/>
        
        <!-- Distant mountains -->
        <polygon points="0,80 40,50 80,60 120,40 160,55 200,35 240,50 270,45 270,160 0,160" fill="url(#mountainGradient)" opacity="0.7"/>
        
        <!-- Forest background -->
        <rect x="0" y="120" width="270" height="150" fill="url(#forestGradient)"/>
        
        <!-- Large trees in background -->
        <ellipse cx="30" cy="140" rx="25" ry="40" fill="#2F4F2F"/>
        <ellipse cx="80" cy="135" rx="30" ry="45" fill="#228B22"/>
        <ellipse cx="130" cy="142" rx="28" ry="42" fill="#2F4F2F"/>
        <ellipse cx="180" cy="138" rx="32" ry="47" fill="#228B22"/>
        <ellipse cx="230" cy="145" rx="26" ry="38" fill="#2F4F2F"/>
        
        <!-- Tree trunks -->
        <rect x="27" y="170" width="6" height="30" fill="#8B4513"/>
        <rect x="77" y="170" width="6" height="35" fill="#654321"/>
        <rect x="127" y="175" width="6" height="30" fill="#8B4513"/>
        <rect x="177" y="175" width="6" height="32" fill="#654321"/>
        <rect x="227" y="175" width="6" height="28" fill="#8B4513"/>
        
        <!-- Foreground trees -->
        <ellipse cx="60" cy="200" rx="20" ry="35" fill="#32CD32"/>
        <ellipse cx="120" cy="195" rx="22" ry="38" fill="#228B22"/>
        <ellipse cx="200" cy="205" rx="18" ry="32" fill="#32CD32"/>
        
        <!-- Foreground tree trunks -->
        <rect x="57" y="225" width="6" height="25" fill="#8B4513"/>
        <rect x="117" y="220" width="6" height="30" fill="#654321"/>
        <rect x="197" y="230" width="6" height="22" fill="#8B4513"/>
        
        <!-- Ground vegetation -->
        <ellipse cx="20" cy="250" rx="15" ry="8" fill="#228B22"/>
        <ellipse cx="50" cy="260" rx="12" ry="6" fill="#32CD32"/>
        <ellipse cx="90" cy="255" rx="18" ry="9" fill="#228B22"/>
        <ellipse cx="140" cy="265" rx="14" ry="7" fill="#32CD32"/>
        <ellipse cx="190" cy="258" rx="16" ry="8" fill="#228B22"/>
        <ellipse cx="230" cy="268" rx="13" ry="6" fill="#32CD32"/>
        
        <!-- Small flowers -->
        <circle cx="40" cy="245" r="3" fill="#FFB6C1"/>
        <circle cx="100" cy="250" r="3" fill="#FF69B4"/>
        <circle cx="160" cy="248" r="3" fill="#FFB6C1"/>
        <circle cx="210" cy="252" r="3" fill="#FF69B4"/>
        
        <!-- Subtle clouds -->
        <ellipse cx="50" cy="25" rx="20" ry="8" fill="white" opacity="0.6"/>
        <ellipse cx="150" cy="20" rx="25" ry="10" fill="white" opacity="0.6"/>
        <ellipse cx="220" cy="30" rx="18" ry="7" fill="white" opacity="0.6"/>
    </svg>`;
}

// Themed affirmation sets for targeted therapeutic support
const affirmationThemes = {
    calm: [
        "Take a deep breath. You are at peace.",
        "This moment of stillness brings you comfort.",
        "Your mind can find quiet in any storm.",
        "You carry tranquility within you always.",
        "Each breath brings deeper relaxation.",
        "You are safe and centered right now.",
        "Peace flows through you like gentle water."
    ],
    confidence: [
        "You have everything you need within you.",
        "Your unique perspective adds value to the world.",
        "You are capable of amazing things.",
        "Trust in your ability to handle challenges.",
        "You are stronger than you realize.",
        "Your voice matters and deserves to be heard.",
        "You belong exactly where you are."
    ],
    hope: [
        "Tomorrow holds new possibilities for you.",
        "Even small steps lead to meaningful change.",
        "Your current struggles are not your final story.",
        "Light always returns after darkness.",
        "You have overcome difficulties before and will again.",
        "Growth happens slowly, but it is happening.",
        "Your future self will thank you for not giving up."
    ],
    selfCompassion: [
        "You deserve the same kindness you give others.",
        "It's okay to make mistakes - you're learning.",
        "Treat yourself with gentle understanding.",
        "You are worthy of love exactly as you are.",
        "Your efforts matter, even when they feel small.",
        "Be patient with yourself during healing.",
        "You are doing the best you can with what you have."
    ],
    resilience: [
        "You have survived every challenge so far.",
        "Your strength grows through each experience.",
        "Setbacks are setups for comebacks.",
        "You bend but you do not break.",
        "Every ending creates space for new beginnings.",
        "Your resilience is your superpower.",
        "You are writing a story of courage and persistence."
    ],
    gratitude: [
        "Today offers you gifts worth noticing.",
        "Your life contains moments of beauty and joy.",
        "You have people who care about your wellbeing.",
        "Small pleasures create big happiness.",
        "You are surrounded by reasons to appreciate life.",
        "Your journey has brought you wisdom and growth.",
        "Every breath is a gift you can cherish."
    ]
};

// Current theme for affirmations (starts with mixed)
let currentAffirmationTheme = 'mixed';

// Get affirmations based on current theme
function getAffirmations() {
    if (currentAffirmationTheme === 'mixed') {
        // Combine all themes for variety
        const allAffirmations = [];
        Object.values(affirmationThemes).forEach(themeArray => {
            allAffirmations.push(...themeArray);
        });
        return allAffirmations;
    }
    return affirmationThemes[currentAffirmationTheme] || affirmationThemes.calm;
}

async function showRandomAffirmation(prefix = "", isWinMessage = false, targetElement = null) {
    console.log("showRandomAffirmation called with:", prefix, isWinMessage);
    
    const messageElement = targetElement || document.getElementById("message");
    console.log("Message element found:", !!messageElement);
    
    if (!messageElement) {
        console.error("Message element not found!");
        return;
    }
    
    let message = '';
    
    // Try to use AI for personalized affirmations (but not for win messages)
    if (sentimentAnalyzer && !isWinMessage) {
        try {
            const allFeedback = JSON.parse(localStorage.getItem('anonymousFeedback') || '[]');
            const sentimentAnalysis = await sentimentAnalyzer.analyzeFeedbackSentiment(allFeedback);
            const personalizedAffirmation = await sentimentAnalyzer.generatePersonalizedAffirmation(sentimentAnalysis);
            message = prefix + personalizedAffirmation;
            console.log("AI affirmation generated:", message);
        } catch (error) {
            console.log('AI affirmation failed, using fallback:', error);
            // Fallback to standard affirmations
            const availableAffirmations = getAffirmations();
            const randomAffirmation = availableAffirmations[Math.floor(Math.random() * availableAffirmations.length)];
            message = prefix + randomAffirmation;
        }
    } else {
        // Standard affirmations for win messages or when AI not available
        const availableAffirmations = getAffirmations();
        const randomAffirmation = availableAffirmations[Math.floor(Math.random() * availableAffirmations.length)];
        message = prefix + randomAffirmation;
        console.log("Standard affirmation selected:", message);
    }
    
    messageElement.textContent = message;
    messageElement.classList.remove("hidden");
    messageElement.style.display = "block";
    
    if (isWinMessage) {
        messageElement.style.color = "#4CAF50";
        messageElement.style.fontWeight = "bold";
    }
    
    console.log("Affirmation displayed:", message);
    
    // Add feedback button after affirmation
    showFeedbackButton(messageElement);
    
    setTimeout(() => {
        messageElement.classList.add("hidden");
        // Also hide feedback when message hides
        const feedbackContainer = document.getElementById('affirmation-feedback');
        if (feedbackContainer) {
            feedbackContainer.remove();
        }
    }, 15000); // Extended time for therapeutic reading and reflection
}

function showFeedbackButton(messageDiv) {
    // Remove any existing feedback button
    const existingFeedback = document.getElementById('affirmation-feedback');
    if (existingFeedback) {
        existingFeedback.remove();
    }
    
    // Create feedback container
    const feedbackContainer = document.createElement('div');
    feedbackContainer.id = 'affirmation-feedback';
    feedbackContainer.style.cssText = `
        margin-top: 15px;
        text-align: center;
        padding: 10px;
        background: #f8f9fa;
        border-radius: 8px;
        border: 1px solid #e9ecef;
    `;
    
    // Create feedback question
    const feedbackQuestion = document.createElement('div');
    feedbackQuestion.textContent = 'How did this affirmation feel?';
    feedbackQuestion.style.cssText = `
        font-size: 0.9em;
        color: #6c757d;
        margin-bottom: 10px;
        font-weight: 500;
    `;
    
    // Create button container for better mobile layout
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        gap: 8px;
        justify-content: center;
        flex-wrap: wrap;
    `;
    
    // Create Helpful button
    const helpfulButton = document.createElement('button');
    helpfulButton.textContent = '😊 Helpful';
    helpfulButton.style.cssText = `
        background: #4CAF50;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.8em;
        font-weight: 500;
        transition: background 0.2s;
    `;
    helpfulButton.onclick = () => handleFeedback('helpful');
    helpfulButton.onmouseover = () => helpfulButton.style.background = '#45a049';
    helpfulButton.onmouseout = () => helpfulButton.style.background = '#4CAF50';
    
    // Create Calming button
    const calmingButton = document.createElement('button');
    calmingButton.textContent = '😌 Calming';
    calmingButton.style.cssText = `
        background: #2196F3;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.8em;
        font-weight: 500;
        transition: background 0.2s;
    `;
    calmingButton.onclick = () => handleFeedback('calming');
    calmingButton.onmouseover = () => calmingButton.style.background = '#1976D2';
    calmingButton.onmouseout = () => calmingButton.style.background = '#2196F3';
    
    // Create Challenging button
    const challengingButton = document.createElement('button');
    challengingButton.textContent = '🤔 Challenging';
    challengingButton.style.cssText = `
        background: #FF9800;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.8em;
        font-weight: 500;
        transition: background 0.2s;
    `;
    challengingButton.onclick = () => handleFeedback('challenging');
    challengingButton.onmouseover = () => challengingButton.style.background = '#F57C00';
    challengingButton.onmouseout = () => challengingButton.style.background = '#FF9800';
    
    // Create Not Helpful button
    const notHelpfulButton = document.createElement('button');
    notHelpfulButton.textContent = 'Not helpful';
    notHelpfulButton.style.cssText = `
        background: #9E9E9E;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.8em;
        font-weight: 500;
        transition: background 0.2s;
    `;
    notHelpfulButton.onclick = () => handleFeedback('notHelpful');
    notHelpfulButton.onmouseover = () => notHelpfulButton.style.background = '#757575';
    notHelpfulButton.onmouseout = () => notHelpfulButton.style.background = '#9E9E9E';
    
    // Assemble button container
    buttonContainer.appendChild(helpfulButton);
    buttonContainer.appendChild(calmingButton);
    buttonContainer.appendChild(challengingButton);
    buttonContainer.appendChild(notHelpfulButton);
    
    // Assemble feedback container
    feedbackContainer.appendChild(feedbackQuestion);
    feedbackContainer.appendChild(buttonContainer);
    
    // Insert after message div
    messageDiv.parentNode.insertBefore(feedbackContainer, messageDiv.nextSibling);
}

function handleFeedback(type) {
    const feedbackContainer = document.getElementById('affirmation-feedback');
    if (!feedbackContainer) return;
    
    // Store feedback anonymously
    const feedback = {
        type: type,
        timestamp: new Date().toISOString(),
        puzzle: getCurrentPuzzleInfo(),
        source: 'affirmation'
    };
    
    const existingFeedback = JSON.parse(localStorage.getItem('anonymousFeedback') || '[]');
    existingFeedback.push(feedback);
    localStorage.setItem('anonymousFeedback', JSON.stringify(existingFeedback));
    
    // Log feedback for potential analytics
    console.log('User feedback on affirmation:', type);
    
    // Show appropriate thank you message based on feedback type
    let thankYouMessage = '';
    if (type === 'helpful') {
        thankYouMessage = 'Thank you! We\'re glad it helped. 💚';
    } else if (type === 'calming') {
        thankYouMessage = 'Thank you! We\'re glad it felt calming. 🌿';
    } else if (type === 'challenging') {
        thankYouMessage = 'Thank you for sharing. Growth often feels challenging. 🌱';
    } else if (type === 'notHelpful') {
        thankYouMessage = 'Thanks for letting us know. We\'ll keep improving. 🔄';
    } else {
        thankYouMessage = 'Thank you for your feedback! 🙏';
    }
    
    // Show thank you message
    feedbackContainer.innerHTML = `
        <div style="color: #28a745; font-size: 0.9em; padding: 5px; text-align: center;">
            ${thankYouMessage}
        </div>
    `;
    
    // Remove feedback after 3 seconds
    setTimeout(() => {
        if (feedbackContainer && feedbackContainer.parentNode) {
            feedbackContainer.remove();
        }
    }, 3000);
}

// Background music system using Web Audio API
class BackgroundMusic {
    constructor() {
        this.audioContext = null;
        this.isPlaying = false;
        this.gainNode = null;
        this.oscillators = [];
        this.noiseBuffer = null;
        this.currentMusicType = 'rain';
    }

    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.gainNode = this.audioContext.createGain();
            this.gainNode.connect(this.audioContext.destination);
            this.gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime); // Low volume
            
            // Create noise buffer for rain effect
            this.createNoiseBuffer();
            
            return true;
        } catch (error) {
            console.log("Audio context initialization failed:", error);
            return false;
        }
    }

    createNoiseBuffer() {
        const bufferSize = this.audioContext.sampleRate * 2;
        this.noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = this.noiseBuffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
    }

    async start() {
        if (!this.audioContext) {
            const initialized = await this.init();
            if (!initialized) return false;
        }

        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        this.isPlaying = true;
        
        // Create music based on selected type
        this.createMusicByType(this.currentMusicType);
        
        return true;
    }

    createAmbientDrone() {
        // Low frequency drone for calm atmosphere
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const droneGain = this.audioContext.createGain();
        
        osc1.frequency.setValueAtTime(55, this.audioContext.currentTime); // A1
        osc2.frequency.setValueAtTime(82.4, this.audioContext.currentTime); // E2
        
        osc1.type = 'sine';
        osc2.type = 'sine';
        
        droneGain.gain.setValueAtTime(0.08, this.audioContext.currentTime);
        
        osc1.connect(droneGain);
        osc2.connect(droneGain);
        droneGain.connect(this.gainNode);
        
        osc1.start();
        osc2.start();
        
        this.oscillators.push(osc1, osc2);
    }

    createMusicByType(type) {
        switch(type) {
            case 'rain':
                this.createSoftRain();
                this.createAmbientDrone();
                break;
            case 'ocean':
                this.createOceanWaves();
                this.createAmbientDrone();
                break;
            case 'forest':
                this.createForestAmbience();
                this.createBirdSounds();
                break;
            case 'calm':
                this.createCalmTones();
                break;
            case 'meditation':
                this.createMeditationBells();
                this.createAmbientDrone();
                break;
            default:
                this.createSoftRain();
                this.createAmbientDrone();
        }
    }

    createSoftRain() {
        // Gentle rain sound using filtered noise
        const noiseSource = this.audioContext.createBufferSource();
        const filter = this.audioContext.createBiquadFilter();
        const rainGain = this.audioContext.createGain();
        
        noiseSource.buffer = this.noiseBuffer;
        noiseSource.loop = true;
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, this.audioContext.currentTime);
        filter.Q.setValueAtTime(1, this.audioContext.currentTime);
        
        rainGain.gain.setValueAtTime(0.05, this.audioContext.currentTime);
        
        noiseSource.connect(filter);
        filter.connect(rainGain);
        rainGain.connect(this.gainNode);
        
        noiseSource.start();
        this.oscillators.push(noiseSource);
    }

    createOceanWaves() {
        // Ocean waves using low-frequency oscillations
        const waveOsc = this.audioContext.createOscillator();
        const waveGain = this.audioContext.createGain();
        const noiseSource = this.audioContext.createBufferSource();
        const filter = this.audioContext.createBiquadFilter();
        
        // Wave rhythm
        waveOsc.frequency.setValueAtTime(0.3, this.audioContext.currentTime);
        waveOsc.type = 'sine';
        
        // Filtered noise for wave texture
        noiseSource.buffer = this.noiseBuffer;
        noiseSource.loop = true;
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(200, this.audioContext.currentTime);
        filter.Q.setValueAtTime(2, this.audioContext.currentTime);
        
        waveGain.gain.setValueAtTime(0.04, this.audioContext.currentTime);
        
        waveOsc.connect(waveGain);
        noiseSource.connect(filter);
        filter.connect(waveGain);
        waveGain.connect(this.gainNode);
        
        waveOsc.start();
        noiseSource.start();
        this.oscillators.push(waveOsc, noiseSource);
    }

    createForestAmbience() {
        // Forest ambience with wind-like sounds
        const noiseSource = this.audioContext.createBufferSource();
        const filter = this.audioContext.createBiquadFilter();
        const forestGain = this.audioContext.createGain();
        
        noiseSource.buffer = this.noiseBuffer;
        noiseSource.loop = true;
        
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(300, this.audioContext.currentTime);
        filter.Q.setValueAtTime(0.5, this.audioContext.currentTime);
        
        forestGain.gain.setValueAtTime(0.03, this.audioContext.currentTime);
        
        noiseSource.connect(filter);
        filter.connect(forestGain);
        forestGain.connect(this.gainNode);
        
        noiseSource.start();
        this.oscillators.push(noiseSource);
    }

    createBirdSounds() {
        // Occasional gentle bird chirps
        const createChirp = () => {
            if (!this.isPlaying) return;
            
            const chirpOsc = this.audioContext.createOscillator();
            const chirpGain = this.audioContext.createGain();
            
            chirpOsc.frequency.setValueAtTime(800 + Math.random() * 400, this.audioContext.currentTime);
            chirpOsc.type = 'sine';
            
            chirpGain.gain.setValueAtTime(0, this.audioContext.currentTime);
            chirpGain.gain.linearRampToValueAtTime(0.02, this.audioContext.currentTime + 0.1);
            chirpGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.3);
            
            chirpOsc.connect(chirpGain);
            chirpGain.connect(this.gainNode);
            
            chirpOsc.start();
            chirpOsc.stop(this.audioContext.currentTime + 0.3);
            
            // Schedule next chirp
            setTimeout(() => createChirp(), 8000 + Math.random() * 12000);
        };
        
        // Start first chirp after a delay
        setTimeout(() => createChirp(), 3000 + Math.random() * 5000);
    }

    createCalmTones() {
        // Peaceful harmonic tones
        const frequencies = [110, 165, 220, 330]; // A2, E3, A3, E4
        frequencies.forEach((freq, index) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);
            osc.type = 'sine';
            
            gain.gain.setValueAtTime(0.02 / (index + 1), this.audioContext.currentTime);
            
            osc.connect(gain);
            gain.connect(this.gainNode);
            
            osc.start();
            this.oscillators.push(osc);
        });
    }

    createMeditationBells() {
        // Soft meditation bell sounds
        const createBell = () => {
            if (!this.isPlaying) return;
            
            const bellOsc = this.audioContext.createOscillator();
            const bellGain = this.audioContext.createGain();
            
            bellOsc.frequency.setValueAtTime(523.25, this.audioContext.currentTime); // C5
            bellOsc.type = 'sine';
            
            bellGain.gain.setValueAtTime(0, this.audioContext.currentTime);
            bellGain.gain.linearRampToValueAtTime(0.03, this.audioContext.currentTime + 0.1);
            bellGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 3);
            
            bellOsc.connect(bellGain);
            bellGain.connect(this.gainNode);
            
            bellOsc.start();
            bellOsc.stop(this.audioContext.currentTime + 3);
            
            // Schedule next bell
            setTimeout(() => createBell(), 15000 + Math.random() * 20000);
        };
        
        // Start first bell after a delay
        setTimeout(() => createBell(), 5000);
    }

    stop() {
        this.isPlaying = false;
        this.oscillators.forEach(osc => {
            try {
                osc.stop();
            } catch (e) {
                // Oscillator might already be stopped
            }
        });
        this.oscillators = [];
    }

    toggle() {
        if (this.isPlaying) {
            this.stop();
            return false;
        } else {
            return this.start();
        }
    }

    // Play a celebratory completion sound
    async playCompletionSound() {
        if (!this.audioContext) {
            await this.init();
        }

        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        // Create a warm, encouraging melody
        const notes = [
            { freq: 523.25, time: 0 },    // C5
            { freq: 659.25, time: 0.15 }, // E5
            { freq: 783.99, time: 0.3 },  // G5
            { freq: 1046.50, time: 0.5 }  // C6
        ];

        notes.forEach(note => {
            setTimeout(() => {
                const osc = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                osc.frequency.setValueAtTime(note.freq, this.audioContext.currentTime);
                osc.type = 'sine';
                
                // Gentle envelope for warm sound
                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.15, this.audioContext.currentTime + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.4);
                
                osc.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                osc.start(this.audioContext.currentTime);
                osc.stop(this.audioContext.currentTime + 0.4);
            }, note.time * 1000);
        });

        // Add a soft chime overlay
        setTimeout(() => {
            const chime = this.audioContext.createOscillator();
            const chimeGain = this.audioContext.createGain();
            
            chime.frequency.setValueAtTime(1568, this.audioContext.currentTime); // G6
            chime.type = 'sine';
            
            chimeGain.gain.setValueAtTime(0, this.audioContext.currentTime);
            chimeGain.gain.linearRampToValueAtTime(0.08, this.audioContext.currentTime + 0.1);
            chimeGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 1.2);
            
            chime.connect(chimeGain);
            chimeGain.connect(this.audioContext.destination);
            
            chime.start(this.audioContext.currentTime);
            chime.stop(this.audioContext.currentTime + 1.2);
        }, 300);
    }
}

function initializePuzzleGame() {
    console.log("Initializing puzzle game...");
    
    let currentDifficulty = '3x3';
    let pieces = [];
    let selectedPiece = null;
    let currentMode = 'numbers'; // 'numbers', 'letters', 'imageNature', 'positiveWords', 'natureWords', 'emotionWords', 'actionWords', 'mindfulWords', 'strengthWords', 'comfortWords', 'gratefulWords', 'healingWords', 'hopeWords'
    let completedModes = JSON.parse(localStorage.getItem('completedModes') || '[]');
    
    // Initialize background music
    const backgroundMusic = new BackgroundMusic();
    
    // Content for different modes
    const puzzleContainer = document.getElementById("puzzle-container");
    const messageElement = document.getElementById("message");
    const quickBoostButton = document.getElementById("quick-boost-button");
    const resetButton = document.getElementById("reset-puzzle-button");
    const nextPuzzleButton = document.getElementById("next-puzzle-button");
    const instructions = document.getElementById("instructions");
    const hideInstructionsBtn = document.getElementById("hide-instructions");
    const themeSelector = document.getElementById("theme-select");
    const puzzleTopicSelector = document.getElementById("puzzle-topic-select");
    const musicToggleButton = document.getElementById("music-toggle-button");
    const musicSelector = document.getElementById("music-selector");
    const musicTypeSelect = document.getElementById("music-type-select");
    
    let isProgressiveMode = true; // Track if we're in auto-advancing mode or manual selection

    // Hide instructions when button is clicked
    if (hideInstructionsBtn) {
        hideInstructionsBtn.addEventListener("click", () => {
            instructions.classList.add("hidden");
        });
    }

    // Quick Boost button
    if (quickBoostButton) {
        quickBoostButton.addEventListener("click", () => {
            showRandomAffirmation("", false, messageElement);
        });
    }

    // Music toggle button
    if (musicToggleButton) {
        musicToggleButton.addEventListener("click", async () => {
            console.log("Music button clicked");
            try {
                const isNowPlaying = await backgroundMusic.toggle();
                console.log("Music playing status:", isNowPlaying);
                musicToggleButton.textContent = isNowPlaying ? "🔇 Music" : "🎵 Music";
                musicToggleButton.style.backgroundColor = isNowPlaying ? "#4CAF50" : "#00796b";
                
                if (isNowPlaying) {
                    musicSelector.style.display = "block";
                    const musicTypes = {
                        rain: "Gentle Rain",
                        ocean: "Ocean Waves", 
                        forest: "Forest Ambience",
                        calm: "Calm Tones",
                        meditation: "Meditation Bells"
                    };
                    messageElement.textContent = `Playing: ${musicTypes[backgroundMusic.currentMusicType]}`;
                    messageElement.classList.remove("hidden");
                    setTimeout(() => {
                        messageElement.classList.add("hidden");
                    }, 2000);
                } else {
                    musicSelector.style.display = "none";
                }
            } catch (error) {
                console.error("Music toggle error:", error);
                messageElement.textContent = "Audio not available in this browser";
                messageElement.classList.remove("hidden");
                setTimeout(() => {
                    messageElement.classList.add("hidden");
                }, 3000);
            }
        });
    }

    // Music type selector
    if (musicTypeSelect) {
        musicTypeSelect.addEventListener("change", (e) => {
            const selectedType = e.target.value;
            backgroundMusic.currentMusicType = selectedType;
            
            if (backgroundMusic.isPlaying) {
                // Restart music with new type
                backgroundMusic.stop();
                setTimeout(async () => {
                    await backgroundMusic.start();
                    const musicTypes = {
                        rain: "Gentle Rain",
                        ocean: "Ocean Waves", 
                        forest: "Forest Ambience",
                        calm: "Calm Tones",
                        meditation: "Meditation Bells"
                    };
                    messageElement.textContent = `Now playing: ${musicTypes[selectedType]}`;
                    messageElement.classList.remove("hidden");
                    setTimeout(() => {
                        messageElement.classList.add("hidden");
                    }, 2000);
                }, 100);
            }
        });
    }

    // Reset button
    if (resetButton) {
        resetButton.addEventListener("click", () => {
            generatePuzzlePieces(currentDifficulty);
            shufflePieces(currentDifficulty);
            messageElement.textContent = "Puzzle reset! Ready for a fresh start!";
            messageElement.classList.remove("hidden");
            setTimeout(() => {
                messageElement.classList.add("hidden");
            }, 2000);
        });
    }

    // Previous puzzle button
    const previousPuzzleButton = document.getElementById("previous-puzzle-button");
    if (previousPuzzleButton) {
        previousPuzzleButton.addEventListener("click", () => {
            if (isProgressiveMode) {
                goToPreviousMode();
            } else {
                goToPreviousPuzzle();
            }
        });
    }

    // Next puzzle button
    if (nextPuzzleButton) {
        nextPuzzleButton.addEventListener("click", () => {
            if (isProgressiveMode) {
                advanceToNextMode();
            } else {
                // For manual mode, check if we're completing a word set
                const maxSets = puzzleContent[currentMode].length;
                const oldWordSet = currentWordSets[currentMode];
                
                generateNewPuzzle();
                
                // Don't show extra affirmation here since individual puzzles already show them
            }
        });
    }

    // Puzzle topic selector
    if (puzzleTopicSelector) {
        // Load saved puzzle mode preference
        const savedPuzzleMode = localStorage.getItem('selectedPuzzleMode') || 'progressive';
        if (savedPuzzleMode === 'progressive') {
            isProgressiveMode = true;
            puzzleTopicSelector.value = 'progressive';
        } else {
            isProgressiveMode = false;
            currentMode = savedPuzzleMode;
            puzzleTopicSelector.value = savedPuzzleMode;
        }
        
        puzzleTopicSelector.addEventListener("change", (e) => {
            const selectedMode = e.target.value;
            localStorage.setItem('selectedPuzzleMode', selectedMode);
            
            if (selectedMode === 'progressive') {
                isProgressiveMode = true;
                // Keep current mode but enable auto-advancement
                messageElement.textContent = "Progressive mode: Complete puzzles to unlock the next theme!";
            } else {
                isProgressiveMode = false;
                currentMode = selectedMode;
                messageElement.textContent = `Now practicing: ${selectedMode.charAt(0).toUpperCase() + selectedMode.slice(1)}`;
            }
            
            updateModeIndicator();
            generatePuzzlePieces(currentDifficulty);
            messageElement.classList.remove("hidden");
            setTimeout(() => {
                messageElement.classList.add("hidden");
            }, 3000);
        });
    }

    // Theme selector
    if (themeSelector) {
        // Load saved theme preference
        const savedTheme = localStorage.getItem('selectedAffirmationTheme') || 'mixed';
        currentAffirmationTheme = savedTheme;
        themeSelector.value = savedTheme;
        
        themeSelector.addEventListener("change", (e) => {
            currentAffirmationTheme = e.target.value;
            localStorage.setItem('selectedAffirmationTheme', currentAffirmationTheme);
            
            // Show a preview of the selected theme
            const themeNames = {
                mixed: "All therapeutic themes combined",
                calm: "Peaceful and relaxing messages",
                confidence: "Empowering and self-assuring messages",
                hope: "Optimistic and forward-looking messages",
                selfCompassion: "Kind and understanding messages",
                resilience: "Strength and perseverance messages",
                gratitude: "Appreciative and thankful messages"
            };
            
            messageElement.textContent = `Now focusing on: ${themeNames[currentAffirmationTheme]}`;
            messageElement.classList.remove("hidden");
            setTimeout(() => {
                messageElement.classList.add("hidden");
            }, 3000);
        });
    }
    
    // No image selection needed for numbered puzzle

    // Initialize the puzzle
    generatePuzzlePieces(currentDifficulty);

    function generatePuzzlePieces(difficulty) {
        const [rows, cols] = difficulty.split('x').map(Number);
        pieces = [];
        
        if (!puzzleContainer) return;
        
        console.log(`Generating ${difficulty} puzzle: ${rows}x${cols} = ${rows * cols} pieces`);
        
        puzzleContainer.innerHTML = '';
        puzzleContainer.className = `puzzle-${difficulty}`;
        
        for (let i = 0; i < rows * cols; i++) {
            const piece = document.createElement('div');
            piece.className = 'puzzle-piece';
            piece.dataset.correctPosition = i;
            piece.dataset.currentPosition = i;
            
            // Use content based on current mode and current word set
            const wordSet = puzzleContent[currentMode][currentWordSets[currentMode] || 0];
            const content = wordSet[i];
            
            if (currentMode === 'imageNature') {
                // For image puzzles, show just the IMG-X text initially
                piece.textContent = content;
                
                // Store image URL for later reveal - 20 diverse therapeutic nature scenes - all verified working
                const imageUrls = [
                    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', // Mountain lake - verified
                    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', // Forest path - verified  
                    'https://images.unsplash.com/photo-1414016642750-7fdd78dc33d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', // Green meadow - verified
                    'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', // Sunflower field - verified
                    'https://images.unsplash.com/photo-1439066615861-d1af74d74000?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', // Ocean waves - verified
                    'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', // Lakeside sunset - verified
                    'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', // Wooden bridge forest - verified
                    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', // Mountain lake 2 - verified
                    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', // Dense forest - verified
                    'https://images.unsplash.com/photo-1506097425191-7ad538b29c52?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', // Desert landscape - verified
                    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', // Forest path 2 - verified
                    'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', // Peaceful waterfall - verified
                    'https://images.unsplash.com/photo-1440342359743-84fcb8c21f21?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', // Golden wheat field - verified
                    'https://images.unsplash.com/photo-1418065460487-3956c3043904?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', // Tropical beach - verified
                    'https://images.unsplash.com/photo-1414016642750-7fdd78dc33d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', // Green meadow 2 - verified
                    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', // Autumn leaves - verified
                    'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', // Snowy pine forest - verified
                    'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', // Sunflower field 2 - verified
                    'https://images.unsplash.com/photo-1439066615861-d1af74d74000?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', // Ocean waves 2 - verified
                    'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'  // Lakeside sunset 2 - verified
                ];
                const currentSet = currentWordSets[currentMode] || 0;
                piece.dataset.imageUrl = imageUrls[currentSet % imageUrls.length];
                piece.dataset.imagePosition = i;
                
                // Style as normal text piece initially
                piece.style.fontSize = '1.2em';
                piece.style.fontWeight = 'bold';
                piece.style.color = '#00796b';
                piece.style.display = 'flex';
                piece.style.alignItems = 'center';
                piece.style.justifyContent = 'center';
                piece.style.backgroundColor = '#e0f7fa';
                piece.style.border = '2px solid #00796b';
                piece.style.borderRadius = '8px';
                piece.style.minHeight = '85px';
                piece.style.minWidth = '85px';
                piece.style.textAlign = 'center';
                
                console.log(`Piece ${i + 1}: created mystery image piece with ${content}`);
            } else {
                // Regular text/number/letter puzzles
                piece.textContent = content;
                
                // Responsive font sizing based on content type and screen size
                let fontSize;
                if (currentMode === 'numbers' || currentMode === 'letters') {
                    fontSize = '1.6em'; // Reduced from 2em
                } else {
                    // Word modes - smaller font for better mobile display
                    fontSize = '0.9em'; // Reduced from 1.4em
                }
                
                piece.style.fontSize = fontSize;
                piece.style.fontWeight = 'bold';
                piece.style.color = '#00796b';
                piece.style.display = 'flex';
                piece.style.alignItems = 'center';
                piece.style.justifyContent = 'center';
                piece.style.backgroundColor = '#e0f7fa';
                piece.style.border = '2px solid #00796b';
                piece.style.borderRadius = '8px';
                piece.style.minHeight = '85px';
                piece.style.minWidth = '85px';
                piece.style.textAlign = 'center';
                piece.style.wordBreak = 'break-word';
                piece.style.lineHeight = '1.2';
                piece.style.textWrap = 'wrap';
                piece.style.overflow = 'hidden';
                
                console.log(`Piece ${i + 1}: created with ${currentMode} ${content}`);
            }
            
            piece.addEventListener('click', handlePieceClick);
            
            puzzleContainer.appendChild(piece);
            pieces.push(piece);
        }
        
        console.log(`Actually created ${pieces.length} pieces`);
        
        // Now shuffle the pieces to make it a puzzle
        setTimeout(() => shufflePieces(difficulty), 100);
    }

    function shufflePieces(difficulty) {
        const [rows, cols] = difficulty.split('x').map(Number);
        
        // Create array of indices to shuffle positions
        const positions = Array.from({length: pieces.length}, (_, i) => i);
        
        // Fisher-Yates shuffle of positions
        for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }
        
        // Clear container and re-add pieces in shuffled order
        puzzleContainer.innerHTML = '';
        positions.forEach((originalIndex, newPosition) => {
            const piece = pieces[originalIndex];
            piece.dataset.currentPosition = newPosition;
            
            // Keep the current mode display system
            const wordSet = puzzleContent[currentMode][currentWordSets[currentMode] || 0];
            const content = wordSet[originalIndex];
            piece.textContent = content;
            
            // Use consistent font sizing
            let fontSize;
            if (currentMode === 'numbers' || currentMode === 'letters') {
                fontSize = '1.6em';
            } else {
                fontSize = '0.9em';
            }
            piece.style.fontSize = fontSize;
            piece.style.fontWeight = 'bold';
            piece.style.color = '#00796b';
            piece.style.display = 'flex';
            piece.style.alignItems = 'center';
            piece.style.justifyContent = 'center';
            piece.style.backgroundColor = '#e0f7fa';
            piece.style.border = '2px solid #00796b';
            piece.style.borderRadius = '8px';
            piece.style.minHeight = '98px';
            piece.style.minWidth = '98px';
            
            puzzleContainer.appendChild(piece);
            console.log(`Piece ${originalIndex + 1} moved to position ${newPosition}`);
        });
        

        
        console.log(`Shuffle complete with ${pieces.length} pieces displayed`);
    }
    
    function isSolved() {
        return pieces.every(piece => 
            piece.dataset.correctPosition === piece.dataset.currentPosition
        );
    }

    function handlePieceClick() {
        if (selectedPiece === this) {
            // Deselect if clicking the same piece
            selectedPiece.classList.remove('selected');
            selectedPiece = null;
        } else if (selectedPiece === null) {
            // Select this piece
            selectedPiece = this;
            this.classList.add('selected');
        } else {
            // Swap content (text content for all puzzle types including imageNature during mystery phase)
            const selectedText = selectedPiece.textContent;
            const currentText = this.textContent;
            const selectedPos = selectedPiece.dataset.currentPosition;
            const currentPos = this.dataset.currentPosition;
            
            // For image puzzles, also swap the stored image data
            if (currentMode === 'imageNature') {
                const selectedImageUrl = selectedPiece.dataset.imageUrl;
                const currentImageUrl = this.dataset.imageUrl;
                const selectedImagePos = selectedPiece.dataset.imagePosition;
                const currentImagePos = this.dataset.imagePosition;
                
                selectedPiece.dataset.imageUrl = currentImageUrl;
                this.dataset.imageUrl = selectedImageUrl;
                selectedPiece.dataset.imagePosition = currentImagePos;
                this.dataset.imagePosition = selectedImagePos;
            }
            
            // Swap the visible text
            selectedPiece.textContent = currentText;
            this.textContent = selectedText;
            
            // Swap the position data
            selectedPiece.dataset.currentPosition = currentPos;
            this.dataset.currentPosition = selectedPos;
            
            // Clear selection
            selectedPiece.classList.remove('selected');
            selectedPiece = null;
            
            // Check win condition
            checkWinCondition();
        }
    }

    function checkWinCondition() {
        // Check if content is in correct sequence based on current mode
        const puzzlePieces = Array.from(puzzleContainer.children);
        
        // Get the current word set index for this mode, defaulting to 0
        const currentWordSetIndex = currentWordSets[currentMode] || 0;
        const wordSet = puzzleContent[currentMode][currentWordSetIndex];
        const expectedSequence = wordSet;
        
        console.log("Checking win condition...");
        console.log("Current mode:", currentMode);
        console.log("Word set index:", currentWordSetIndex);
        console.log("Current pieces:", puzzlePieces.map(p => p.textContent));
        console.log("Expected sequence:", expectedSequence);
        
        const isWon = puzzlePieces.every((piece, index) => {
            const matches = piece.textContent.trim() === expectedSequence[index].trim();
            return matches;
        });
        
        console.log("Is won:", isWon);
        
        if (isWon) {
            // Special reveal for image puzzles
            if (currentMode === 'imageNature') {
                revealImagePuzzle();
            }
            
            // Mark this mode as completed
            if (!completedModes.includes(currentMode)) {
                completedModes.push(currentMode);
                localStorage.setItem('completedModes', JSON.stringify(completedModes));
            }
            
            // Show affirmation for each individual puzzle completion
            console.log("Puzzle completed! Showing affirmation...");
            showRandomAffirmation("", true);
            
            // Add celebration animation
            puzzleContainer.classList.add('celebrate');
            setTimeout(() => {
                puzzleContainer.classList.remove('celebrate');
            }, 600);
            
            // Auto-advance in progressive mode only - longer delay for image puzzles
            const delayTime = currentMode === 'imageNature' ? 8000 : 3000; // 8 seconds for image reveal
            if (isProgressiveMode) {
                setTimeout(() => {
                    advanceToNextMode();
                }, delayTime);
            } else {
                // For manual selection mode, generate a new puzzle - longer delay for image puzzles
                const manualDelayTime = currentMode === 'imageNature' ? 6000 : 2000;
                setTimeout(() => {
                    generateNewPuzzle();
                }, manualDelayTime);
            }
            
            // Play celebratory completion sound
            backgroundMusic.playCompletionSound();
        }
    }
    
    function revealImagePuzzle() {
        console.log("Revealing nature image puzzle!");
        
        pieces.forEach((piece, index) => {
            setTimeout(() => {
                // Get the piece number (1-9) to determine which part of image to show
                const pieceNumber = parseInt(piece.textContent);
                const imageRow = Math.floor((pieceNumber - 1) / 3); // Convert 1-9 to 0-2 row
                const imageCol = (pieceNumber - 1) % 3; // Convert 1-9 to 0-2 col
                
                // Clear text content
                piece.textContent = '';
                
                // Apply proper styling for image piece
                piece.style.overflow = 'hidden';
                piece.style.position = 'relative';
                piece.style.padding = '0';
                piece.style.backgroundColor = 'transparent';
                piece.style.backgroundImage = `url(${piece.dataset.imageUrl})`;
                piece.style.backgroundSize = '300% 300%'; // 3x3 grid = 300% total size
                piece.style.backgroundPosition = `${imageCol * 50}% ${imageRow * 50}%`; // Position based on piece number
                piece.style.backgroundRepeat = 'no-repeat';
                piece.style.border = '1px solid rgba(0, 121, 107, 0.3)'; // Much thinner, semi-transparent border
                piece.style.borderRadius = '4px'; // Smaller radius
                
                // Add reveal animation with scale effect
                piece.style.transform = 'scale(1.1)';
                piece.style.transition = 'transform 0.3s ease';
                setTimeout(() => {
                    piece.style.transform = 'scale(1)';
                }, 200);
                
            }, index * 80); // Stagger the reveal for dramatic effect
        });
    }
    
    function generateNewPuzzle() {
        // Advance to next word set for this theme
        const maxSets = puzzleContent[currentMode].length;
        const oldWordSet = currentWordSets[currentMode];
        currentWordSets[currentMode] = (currentWordSets[currentMode] + 1) % maxSets;
        
        // Don't show extra affirmation here since individual puzzles already show them
        
        // Generate a new puzzle with the new word set
        generatePuzzlePieces(currentDifficulty);
        
        // Show affirmation instead of "Ready for set..." message
        const messageElement = document.getElementById('message');
        if (messageElement && oldWordSet !== maxSets - 1) {
            showRandomAffirmation("🌟 Keep going! ", false);
        }
    }
    
    function getCompletionMessage() {
        const modeMessages = {
            numbers: "Amazing! You mastered numbers! Next: try letters! ",
            letters: "Fantastic! You conquered letters! Next: try the nature image puzzle! ",
            imageNature: "Beautiful! You completed the nature scene! Next: try positive words! ",
            positiveWords: "Wonderful! You completed positive words! Next: nature words! ",
            natureWords: "Beautiful! You mastered nature! Next: emotion words! ",
            emotionWords: "Excellent! You explored emotions! Next: action words! ",
            actionWords: "Great! You learned actions! Next: mindful words! ",
            mindfulWords: "Perfect! You practiced mindfulness! Next: strength words! ",
            strengthWords: "Powerful! You built strength! Next: comfort words! ",
            comfortWords: "Soothing! You found comfort! Next: grateful words! ",
            gratefulWords: "Blessed! You practiced gratitude! Next: healing words! ",
            healingWords: "Healing! You embraced wellness! Next: hope words! ",
            hopeWords: "Inspiring! You completed all 12 therapeutic themes! You're incredible! Starting over with fresh energy! "
        };
        return modeMessages[currentMode] || "Wonderful job! ";
    }
    
    function goToPreviousMode() {
        // Only work in progressive mode
        if (!isProgressiveMode) {
            return;
        }
        
        const progression = [
            'numbers', 'letters', 'imageNature', 'positiveWords', 'natureWords', 'emotionWords', 'actionWords',
            'mindfulWords', 'strengthWords', 'comfortWords', 'gratefulWords', 'healingWords', 'hopeWords'
        ];
        const currentIndex = progression.indexOf(currentMode);
        
        if (currentIndex > 0) {
            currentMode = progression[currentIndex - 1];
            updateModeIndicator();
            generatePuzzlePieces(currentDifficulty);
        } else {
            // Go to last mode if at beginning
            currentMode = progression[progression.length - 1];
            updateModeIndicator();
            generatePuzzlePieces(currentDifficulty);
        }
    }

    function goToPreviousPuzzle() {
        // Go to previous word set in current theme
        const maxSets = puzzleContent[currentMode].length;
        currentWordSets[currentMode] = (currentWordSets[currentMode] - 1 + maxSets) % maxSets;
        
        // Generate puzzle with previous word set
        generatePuzzlePieces(currentDifficulty);
        
        // Show encouraging message
        showRandomAffirmation("↩️ Going back! ", false);
    }

    function advanceToNextMode() {
        // Only advance automatically if in progressive mode
        if (!isProgressiveMode) {
            return; // Stay on current manually selected mode
        }
        
        const progression = [
            'numbers', 'letters', 'imageNature', 'positiveWords', 'natureWords', 'emotionWords', 'actionWords',
            'mindfulWords', 'strengthWords', 'comfortWords', 'gratefulWords', 'healingWords', 'hopeWords'
        ];
        const currentIndex = progression.indexOf(currentMode);
        
        if (currentIndex < progression.length - 1) {
            currentMode = progression[currentIndex + 1];
            updateModeIndicator();
            generatePuzzlePieces(currentDifficulty);
        } else {
            // All modes completed - cycle back to beginning with achievement recognition
            currentMode = 'numbers';
            updateModeIndicator();
            generatePuzzlePieces(currentDifficulty);
        }
    }
    
    function updateModeIndicator() {
        const modeNames = {
            numbers: 'Numbers (1-9)',
            letters: 'Letters (A-I)', 
            imageNature: 'Nature Image Puzzle',
            positiveWords: 'Positive Words',
            natureWords: 'Nature Words',
            emotionWords: 'Emotion Words',
            actionWords: 'Action Words',
            mindfulWords: 'Mindful Words',
            strengthWords: 'Strength Words',
            comfortWords: 'Comfort Words',
            gratefulWords: 'Grateful Words',
            healingWords: 'Healing Words',
            hopeWords: 'Hope Words'
        };
        
        const modeDescriptions = {
            numbers: 'Arrange numbers in order - Foundation practice',
            letters: 'Arrange letters alphabetically - Sequencing skills',
            imageNature: 'Arrange image pieces to create nature scene - Visual puzzle',
            positiveWords: 'Arrange positive words - Uplifting thoughts',
            natureWords: 'Arrange nature words - Connection to earth',
            emotionWords: 'Arrange emotion words - Feeling awareness',
            actionWords: 'Arrange action words - Empowering movement',
            mindfulWords: 'Arrange mindful words - Present moment awareness',
            strengthWords: 'Arrange strength words - Inner resilience',
            comfortWords: 'Arrange comfort words - Soothing presence',
            gratefulWords: 'Arrange grateful words - Appreciative mindset',
            healingWords: 'Arrange healing words - Wellness journey',
            hopeWords: 'Arrange hope words - Optimistic outlook'
        };
        
        // Update header or create mode indicator
        let modeIndicator = document.getElementById('mode-indicator');
        if (!modeIndicator) {
            modeIndicator = document.createElement('div');
            modeIndicator.id = 'mode-indicator';
            modeIndicator.style.cssText = 'background: #c8e6c9; padding: 12px; border-radius: 8px; margin-bottom: 15px; text-align: center; font-weight: bold; color: #2e7d32; line-height: 1.4;';
            puzzleContainer.parentNode.insertBefore(modeIndicator, puzzleContainer);
        }
        
        const progression = [
            'numbers', 'letters', 'imageNature', 'positiveWords', 'natureWords', 'emotionWords', 'actionWords',
            'mindfulWords', 'strengthWords', 'comfortWords', 'gratefulWords', 'healingWords', 'hopeWords'
        ];
        const currentIndex = progression.indexOf(currentMode);
        const progressText = `(${currentIndex + 1} of ${progression.length})`;
        
        const modeDisplay = isProgressiveMode ? `${modeNames[currentMode]} ${progressText}` : `${modeNames[currentMode]} (Manual Selection)`;
        
        modeIndicator.innerHTML = `
            <div style="font-size: 1.1em;">${modeDisplay}</div>
            <div style="font-size: 0.9em; margin-top: 4px; opacity: 0.8;">${modeDescriptions[currentMode]}</div>
        `;
    }

    function unlockNextDifficulty() {
        // Since we only have 3x3 puzzle now, just show completion message
        console.log("Puzzle completed successfully!");
    }

    // Initialize the puzzle - Start with 3x3 and show mode indicator
    currentDifficulty = '3x3';
    updateModeIndicator();
    generatePuzzlePieces(currentDifficulty);
}