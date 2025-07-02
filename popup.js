
const messages = {};
let currentLocale = 'ru'; 

function getText(key, substitutions = []) 
{
    const messageData = messages[currentLocale]?.[key];
    if (!messageData) return key;
    let message = messageData.message;
    substitutions.forEach((sub, i) => 
    {
        message = message.replace(`$${i + 1}`, String(sub));
    });
    return message;
}

async function getVideoData() {
    const videoElement = document.querySelector('video.html5-main-video');
    if (videoElement && videoElement.duration > 0 && !isNaN(videoElement.duration)) 
    {
        let videoTitle = document.querySelector('#title > h1 > yt-formatted-string')?.textContent.trim() || document.title.replace(/ - YouTube$/, '').trim();
        const seconds = videoElement.duration;
        const date = new Date(null);
        date.setSeconds(seconds);
        const timeString = seconds >= 3600 ? date.toISOString().substr(11, 8) : date.toISOString().substr(14, 5);
        return { duration: timeString, title: videoTitle };
    }
    return null;
}

const tabListElement = document.getElementById('tab-list');
const refreshButton = document.getElementById('refresh-button');
const statusElement = document.getElementById('status');

function renderStaticText() 
{
    refreshButton.textContent = getText("refreshButtonText");
    document.querySelectorAll('.lang-btn').forEach(btn => 
    {
        btn.classList.toggle('active', btn.dataset.lang === currentLocale);
    });
}

async function renderTabList() {
    renderStaticText();
    statusElement.textContent = getText("statusLoading");

    try {
        const [tabs, storageResult] = await Promise.all([
            chrome.tabs.query({ url: "*://*.youtube.com/*" }),
            chrome.storage.local.get('videoMemory')
        ]);
        let memory = storageResult.videoMemory || {};

        const openTabUrls = new Set(tabs.map(tab => tab.url.split('&')[0]));
        let memoryWasCleaned = false;
        for (const storedUrl in memory) {
            if (!openTabUrls.has(storedUrl)) 
            {
                delete memory[storedUrl];
                memoryWasCleaned = true;
            }
        }
        if (memoryWasCleaned) {
            await chrome.storage.local.set({ videoMemory: memory });
        }

        tabListElement.innerHTML = '';
        if (tabs.length === 0) {
            tabListElement.innerHTML = `<li>${getText("statusNoTabs")}</li>`;
            statusElement.textContent = '';
            return;
        }

        tabs.forEach(tab => 
        {
            const canonicalUrl = tab.url.split('&')[0];
            const savedData = memory[canonicalUrl];
            const listItem = document.createElement('li');
            listItem.className = 'tab-item';
            const durationSpan = document.createElement('span');
            durationSpan.className = 'duration';
            const titleSpan = document.createElement('span');
            titleSpan.className = 'title';

            if (savedData) 
            {
                durationSpan.textContent = `[${savedData.duration}]`;
                titleSpan.textContent = savedData.title;
            } else 
            {
                durationSpan.textContent = getText("durationUnknown");
                titleSpan.textContent = tab.title.replace(/ - YouTube$/, '').trim();
            }

            listItem.appendChild(durationSpan);
            listItem.appendChild(titleSpan);
            listItem.title = titleSpan.textContent;
            listItem.addEventListener('click', () => 
            {
                chrome.tabs.update(tab.id, { active: true });
                chrome.windows.update(tab.windowId, { focused: true });
            });
            tabListElement.appendChild(listItem);
        });
        statusElement.textContent = getText("statusTabsFound", [tabs.length]);
    } catch (e) 
    {
        statusElement.textContent = "Ошибка при загрузке списка.";
        console.error("Error rendering tab list:", e);
    }
}

refreshButton.addEventListener('click', async () => 
{
    refreshButton.disabled = true;
    refreshButton.textContent = getText("statusUpdating");
    statusElement.textContent = ' ';

    try 
    {
        const tabs = await chrome.tabs.query({ url: "*://*.youtube.com/*" });
        const scriptPromises = tabs.map(tab =>
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: getVideoData,
            })
            .then(results => ({ url: tab.url, data: results[0]?.result }))
            .catch(error => 
            {
                return { url: tab.url, data: null };
            })
        );
        const allResults = await Promise.all(scriptPromises);
        const storageResult = await chrome.storage.local.get('videoMemory');
        const memory = storageResult.videoMemory || {};
        let updatedCount = 0;

        for (const result of allResults) {
            if (result.data) 
            {
                const key = result.url.split('&')[0];
                memory[key] = { ...result.data, lastUpdated: Date.now() };
                updatedCount++;
            }
        }
        
        await chrome.storage.local.set({ videoMemory: memory });
        await renderTabList();
        statusElement.textContent = getText("statusUpdated", [updatedCount, tabs.length]);

    } 
    catch (error) 
    {
        console.error("Произошла ошибка в процессе обновления:", error);
        statusElement.textContent = "Произошла ошибка.";
    } 
    finally 
    {
        refreshButton.disabled = false;
    }
});


async function init() {
    const locales = ['en', 'ru', 'ua'];
    try 
    {
        const fetchPromises = locales.map(locale =>
            fetch(chrome.runtime.getURL(`/_locales/${locale}/messages.json`))
            .then(response => response.json())
            .then(data => { messages[locale] = data; })
        );
        await Promise.all(fetchPromises);
    } 
    catch (e) 
    {
        document.body.innerHTML = "Ошибка: не удалось загрузить файлы расширения. Попробуйте перезагрузить расширение на странице chrome://extensions";
        return;
    }

    const { userLocale } = await chrome.storage.local.get('userLocale');
    const browserLocale = chrome.i18n.getUILanguage().split('-')[0];
    currentLocale = userLocale || (messages[browserLocale] ? browserLocale : 'en');

    document.querySelectorAll('.lang-btn').forEach(btn => 
    {
        btn.addEventListener('click', async () => 
        {
            const newLocale = btn.dataset.lang;
            await chrome.storage.local.set({ userLocale: newLocale });
            currentLocale = newLocale;
            await renderTabList();
        });
    });

    await renderTabList();
}

init();