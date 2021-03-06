'use strict';

(() => {
  window.jQuery('body').tooltip({
    selector: '[data-toggle="tooltip"]'
  })

  const statusImage = document.getElementById('statusImage')
  const popupFooter = document.getElementById('popupFooter')
  const lastSyncDate = document.getElementById('lastSyncDate')
  const oriMatchFound = document.getElementById('oriMatchFound')
  const registryMatchFound = document.getElementById('matchFound')
  const vpnAdvertising = document.getElementById('vpnAdvertising')
  const extensionStatus = document.getElementById('extensionStatus')
  const extensionStatusLabel = document.getElementById('extensionStatusLabel')
  const cooperationAccepted = document.getElementById('cooperationAccepted')
  const cooperationRejected = document.getElementById('cooperationRejected')
  const currentDomain = document.getElementById('currentDomain')
  const extensionName = document.getElementById('extensionName')
  const redIcon = chrome.extension.getURL('images/red_icon.png')

  chrome.runtime.getBackgroundPage((bgWindow) => {
    extensionName.innerText = bgWindow.censortracker.settings.getTitle()

    const updateExtensionStatusLabel = () => {
      let labelText = 'Расширение выключено'
      let tooltipStatus = 'выключен'
      const extName = bgWindow.censortracker.settings.getName()

      if (extensionStatus.checked) {
        labelText = 'Расширение включено'
        tooltipStatus = 'включен'
      }
      extensionStatusLabel.innerText = labelText
      extensionStatusLabel.setAttribute('title', `${extName} ${tooltipStatus}`)
    }

    document.addEventListener('click', (event) => {
      if (event.target.matches(`#${extensionStatus.id}`)) {
        updateExtensionStatusLabel()
        if (extensionStatus.checked) {
          popupFooter.hidden = false
          bgWindow.censortracker.shortcuts.enableExtension()
          bgWindow.censortracker.proxies.setProxy()
        } else {
          popupFooter.hidden = true
          bgWindow.censortracker.proxies.removeProxy()
          bgWindow.censortracker.shortcuts.disableExtension()
        }
      }
    })

    chrome.storage.local.get(
      {
        enableExtension: true
      },
      (config) => {
        if (config.enableExtension) {
          extensionStatus.checked = config.enableExtension
        }
      }
    )

    chrome.tabs.query(
      {
        active: true,
        lastFocusedWindow: true
      },
      (tabs) => {
        const activeTab = tabs[0]
        const activeTabUrl = activeTab.url

        if (activeTabUrl.startsWith('chrome-extension://')) {
          popupFooter.hidden = true
          return
        }

        const urlObject = new URL(activeTabUrl)
        const currentHostname = bgWindow.censortracker.shortcuts.cleanHostname(urlObject.hostname)

        chrome.storage.local.get(
          {
            enableExtension: true
          },
          (config) => {
            if (bgWindow.censortracker.shortcuts.validURL(currentHostname)) {
              currentDomain.innerText = currentHostname.replace('www.', '')
            }

            updateExtensionStatusLabel()

            if (config.enableExtension) {
              bgWindow.censortracker.registry.getLastSyncTimestamp((timestamp) => {
                lastSyncDate.innerText = timestamp.replace(/\//g, '.')
              })

              bgWindow.censortracker.registry.checkDomains(currentHostname, {
                onMatchFound: (_data) => {
                  registryMatchFound.innerHTML = bgWindow.censortracker.shortcuts.createSearchLink(currentHostname)
                  vpnAdvertising.hidden = false
                  statusImage.setAttribute('src', redIcon)
                }
              })

              bgWindow.censortracker.registry.checkDistributors(currentHostname, {
                onMatchFound: (cooperationRefused) => {
                  oriMatchFound.innerHTML = bgWindow.censortracker.shortcuts.createSearchLink(currentHostname)
                  vpnAdvertising.hidden = false
                  statusImage.setAttribute('src', redIcon)

                  if (cooperationRefused) {
                    cooperationRejected.hidden = false
                  } else {
                    cooperationAccepted.hidden = false
                  }
                }
              })
            } else {
              popupFooter.hidden = true
            }
          }
        )
      }
    )

    const show = () => {
      document.documentElement.style.visibility = 'initial'
    }

    setTimeout(show, 165)
  })
})()
