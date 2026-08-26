___TERMS_OF_SERVICE___

By creating or modifying this file you agree to Google Tag Manager's Community
Template Gallery Developer Terms of Service available at
https://developers.google.com/tag-manager/gallery-tos (or such other URL as
Google may provide), as modified from time to time.


___INFO___

{
  "type": "TAG",
  "id": "cvt_KFNBV",
  "version": 1,
  "displayName": "Meta Dedup Monitor (browser)",
  "categories": [
    "ADVERTISING",
    "ANALYTICS",
    "CONVERSIONS",
    "MARKETING",
    "REMARKETING"
  ],
  "brand": {
    "id": "meta-dedup-monitor",
    "displayName": "Meta Dedup Monitor"
  },
  "description": "Fork of Stape's Facebook Pixel template that sends a faithful copy of each browser event (same event_id, same user_data/custom_data) to a Meta Deduplication Monitor collector (/c/browser) instead of Meta. Collector-only: duplicate your real Meta tag on the same trigger and point this copy at the collector.",
  "containerContexts": [
    "WEB"
  ],
  "securityGroups": []
}


___TEMPLATE_PARAMETERS___

[
  {
    "type": "GROUP",
    "name": "dedupMonitorGroup",
    "displayName": "Meta Dedup Monitor",
    "groupStyle": "ZIPPY_OPEN",
    "subParams": [
      {
        "type": "TEXT",
        "name": "collectorUrl",
        "displayName": "Collector URL (browser channel)",
        "simpleValueType": true,
        "help": "E.g. https://YOUR-HOST/c/browser or /c/\u003csecret\u003e/browser. If empty, the tag sends nothing."
      },
      {
        "type": "CHECKBOX",
        "name": "forwardUserData",
        "checkboxText": "Include user_data (advanced matching) in the copy",
        "simpleValueType": true,
        "defaultValue": true
      },
      {
        "type": "CHECKBOX",
        "name": "forwardCustomData",
        "checkboxText": "Include custom_data in the copy",
        "simpleValueType": true,
        "defaultValue": true
      }
    ]
  },
  {
    "type": "GROUP",
    "name": "baseConfigurationGroup",
    "subParams": [
      {
        "type": "TEXT",
        "name": "pixelIds",
        "displayName": "Facebook Pixel ID(s)",
        "simpleValueType": true,
        "valueValidators": [
          {
            "type": "NON_EMPTY"
          },
          {
            "type": "REGEX",
            "args": [
              "^[0-9,]+$"
            ]
          }
        ],
        "help": "Array, single item string or comma separated string of Pixel IDs.",
        "alwaysInSummary": true,
        "valueHint": "1234...,9876..."
      },
      {
        "type": "SELECT",
        "name": "inheritEventName",
        "displayName": "Event Name Setup Method",
        "selectItems": [
          {
            "value": "inherit",
            "displayValue": "Inherit from DataLayer"
          },
          {
            "value": "override",
            "displayValue": "Override"
          }
        ],
        "simpleValueType": true,
        "subParams": [
          {
            "type": "RADIO",
            "name": "eventName",
            "radioItems": [
              {
                "value": "standard",
                "displayValue": "Standard",
                "subParams": [
                  {
                    "type": "SELECT",
                    "name": "eventNameStandard",
                    "macrosInSelect": false,
                    "selectItems": [
                      {
                        "value": "PageView",
                        "displayValue": "PageView"
                      },
                      {
                        "value": "AddPaymentInfo",
                        "displayValue": "AddPaymentInfo"
                      },
                      {
                        "value": "AddToCart",
                        "displayValue": "AddToCart"
                      },
                      {
                        "value": "AddToWishlist",
                        "displayValue": "AddToWishlist"
                      },
                      {
                        "value": "CompleteRegistration",
                        "displayValue": "CompleteRegistration"
                      },
                      {
                        "value": "Contact",
                        "displayValue": "Contact"
                      },
                      {
                        "value": "CustomizeProduct",
                        "displayValue": "CustomizeProduct"
                      },
                      {
                        "value": "Donate",
                        "displayValue": "Donate"
                      },
                      {
                        "value": "FindLocation",
                        "displayValue": "FindLocation"
                      },
                      {
                        "value": "InitiateCheckout",
                        "displayValue": "InitiateCheckout"
                      },
                      {
                        "value": "Lead",
                        "displayValue": "Lead"
                      },
                      {
                        "value": "Purchase",
                        "displayValue": "Purchase"
                      },
                      {
                        "value": "Schedule",
                        "displayValue": "Schedule"
                      },
                      {
                        "value": "Search",
                        "displayValue": "Search"
                      },
                      {
                        "value": "StartTrial",
                        "displayValue": "StartTrial"
                      },
                      {
                        "value": "SubmitApplication",
                        "displayValue": "SubmitApplication"
                      },
                      {
                        "value": "Subscribe",
                        "displayValue": "Subscribe"
                      },
                      {
                        "value": "ViewContent",
                        "displayValue": "ViewContent"
                      }
                    ],
                    "simpleValueType": true,
                    "displayName": "Event Name",
                    "defaultValue": "PageView"
                  }
                ]
              },
              {
                "value": "custom",
                "displayValue": "Custom",
                "subParams": [
                  {
                    "type": "TEXT",
                    "name": "eventNameCustom",
                    "simpleValueType": true,
                    "displayName": "Event Name",
                    "valueValidators": [
                      {
                        "type": "NON_EMPTY"
                      }
                    ]
                  }
                ]
              }
            ],
            "simpleValueType": true,
            "enablingConditions": [
              {
                "paramName": "inheritEventName",
                "paramValue": "override",
                "type": "EQUALS"
              }
            ],
            "displayName": "Event Type"
          }
        ],
        "defaultValue": "override",
        "alwaysInSummary": true
      },
      {
        "type": "CHECKBOX",
        "name": "enableDataLayerMapping",
        "checkboxText": "Enable automatic User Data and Event Parameters mapping from the Data Layer",
        "simpleValueType": true,
        "help": "If you check this, then the Facebook tag will populate standard Object Properties and User Data automatically from the DataLayer. The tag parses Universal Analytics,  \u003ca target\u003d\"_blank\" href\u003d\"https://developers.google.com/analytics/devguides/collection/ga4/ecommerce\"\u003eGA4\u003c/a\u003e and \u003ca target\u003d\"_blank\" href\u003d\"https://developers.google.com/tag-platform/tag-manager/server-side/common-event-data\"\u003eCommon Event Data\u003c/a\u003e formats.",
        "defaultValue": true,
        "alwaysInSummary": true,
        "subParams": [
          {
            "type": "CHECKBOX",
            "name": "enableCurrentDataLayerOnly",
            "checkboxText": "Use data only from the most recent Data Layer event where the data can be found (ignore recursive merges)",
            "simpleValueType": true,
            "help": "If enabled, the tag will take data only from the most recent Data Layer event where the data can be found. \n\u003cbr/\u003e\u003cbr/\u003e\nIn other words, the tag will ignore recursive merges for Data Layer variables and take only the most recent value of the data. \u003ca href\u003d\"https://www.simoahava.com/gtm-tips/data-layer-variable-versions-explained/\"\u003eLearn more\u003c/a\u003e.\n\u003cbr/\u003e\nThat\u0027s how it worked in the old Facebook pixel tag.",
            "defaultValue": false,
            "enablingConditions": [
              {
                "paramName": "enableDataLayerMapping",
                "paramValue": true,
                "type": "EQUALS"
              }
            ],
            "alwaysInSummary": true
          }
        ]
      },
      {
        "type": "CHECKBOX",
        "name": "enableEdvancedMatching",
        "checkboxText": "Enable Advanced Matching",
        "simpleValueType": true,
        "help": "Enable sending of user personal information such as email addresses, names, etc. to Meta.\n\u003cbr/\u003e\nMore information can be found \u003ca target\u003d\"_blank\" href\u003d\"https://developers.facebook.com/docs/meta-pixel/advanced/advanced-matching/\"\u003ehere\u003c/a\u003e.",
        "subParams": [
          {
            "type": "GROUP",
            "name": "advancedMatchingGroup",
            "subParams": [
              {
                "type": "CHECKBOX",
                "name": "enableEventEnhancement",
                "checkboxText": "Enable Event Enhancement",
                "simpleValueType": true,
                "help": "Enable the use of \u003ci\u003elocalStorage\u003c/i\u003e to store data for enhanced event tracking.\n\u003cbr/\u003e\u003cbr/\u003e\nNote: If the \u003ci\u003eEnable automatic data population from the Data Layer\u003c/i\u003e option is selected, all User Data it finds in the Data Layer will be stored, not just the fields explicitly defined in the User Data section.",
                "subParams": [
                  {
                    "type": "CHECKBOX",
                    "name": "storeUserDataHashed",
                    "checkboxText": "Store User Data hashed",
                    "simpleValueType": true,
                    "help": "The User Data will be stored hashed in \u003ci\u003elocalStorage\u003c/i\u003e.",
                    "enablingConditions": [
                      {
                        "paramName": "enableEventEnhancement",
                        "paramValue": true,
                        "type": "EQUALS"
                      }
                    ]
                  }
                ]
              },
              {
                "type": "CHECKBOX",
                "name": "runInitOnce",
                "checkboxText": "Run the \u0027init\u0027 command only once",
                "simpleValueType": true,
                "help": "When Advanced Matching is enabled, the tag runs the \u003ci\u003einit\u003c/i\u003e command with each event to send user information that becomes available after page load.\n\u003cbr/\u003e\u003cbr/\u003e\nThis causes the following message in the Console from the fbevents.js file:\n\u003ci\u003e[Meta Pixel] - Duplicate Pixel ID: {Pixel ID}.\u003c/i\u003e\n\u003cbr/\u003e\u003cbr/\u003e\nEnable this option to skip repeated \u003ci\u003einit\u003c/i\u003e calls and suppress the Console message. Note that Advanced Matching data found after the first call won’t be sent."
              }
            ],
            "enablingConditions": [
              {
                "paramName": "enableEdvancedMatching",
                "paramValue": true,
                "type": "EQUALS"
              }
            ]
          }
        ],
        "defaultValue": true,
        "alwaysInSummary": true
      }
    ]
  },
  {
    "type": "GROUP",
    "name": "complianceGroup",
    "displayName": "Compliance",
    "groupStyle": "ZIPPY_OPEN",
    "subParams": [
      {
        "type": "SELECT",
        "name": "consent",
        "displayName": "Consent Granted",
        "macrosInSelect": true,
        "selectItems": [
          {
            "value": true,
            "displayValue": "True"
          },
          {
            "value": false,
            "displayValue": "False"
          }
        ],
        "simpleValueType": true,
        "help": "Setting Consent Granted to \u003cstrong\u003efalse\u003c/strong\u003e will prevent the pixel from sending hits until tag fired with Consent Granted \u003cstrong\u003etrue\u003c/strong\u003e.\n\u003cbr/\u003e\n\u003ca href\u003d\"https://developers.facebook.com/docs/meta-pixel/implementation/gdpr\"\u003eLearn more\u003c/a\u003e.",
        "enablingConditions": [
          {
            "paramName": "enableConsentMode",
            "paramValue": false,
            "type": "EQUALS"
          }
        ]
      },
      {
        "type": "CHECKBOX",
        "name": "enableConsentMode",
        "checkboxText": "Enable GTM consent mode support",
        "simpleValueType": true,
        "help": "When enabled, this tag checks for the Google Consent Mode \u003ci\u003ead_storage\u003c/i\u003e consent.\n\u003cbr/\u003e\nIf consent is not granted, the Facebook Pixel consent is set as revoked. \n\u003cbr/\u003e\nIf consent is granted (initially or later), the pixel consent is automatically granted."
      },
      {
        "type": "CHECKBOX",
        "name": "dpoLDU",
        "checkboxText": "Limited Data Use (LDU)",
        "simpleValueType": true,
        "help": "Limited Data Use is a data processing option that gives you more control over how your data is used in the system receiving the data. \u003ca target\u003d\"_blank\" href\u003d\"https://developers.facebook.com/docs/meta-pixel/implementation/data-processing-options\"\u003eLearn more\u003c/a\u003e."
      },
      {
        "type": "TEXT",
        "name": "dpoCountry",
        "displayName": "Country",
        "simpleValueType": true,
        "defaultValue": 0,
        "enablingConditions": [
          {
            "paramName": "dpoLDU",
            "paramValue": true,
            "type": "EQUALS"
          }
        ],
        "valueValidators": [
          {
            "type": "NUMBER"
          }
        ]
      },
      {
        "type": "TEXT",
        "name": "dpoState",
        "displayName": "State",
        "simpleValueType": true,
        "defaultValue": 0,
        "enablingConditions": [
          {
            "paramName": "dpoLDU",
            "paramValue": true,
            "type": "EQUALS"
          }
        ],
        "valueValidators": [
          {
            "type": "NUMBER"
          }
        ]
      }
    ]
  },
  {
    "displayName": "User Data",
    "name": "userDataListGroup",
    "groupStyle": "ZIPPY_CLOSED",
    "type": "GROUP",
    "subParams": [
      {
        "type": "LABEL",
        "name": "userDataLabel",
        "displayName": "User Data Properties that you can send to Meta can be found \u003ca target\u003d\"_blank\" href\u003d\"https://developers.facebook.com/docs/meta-pixel/advanced/advanced-matching\"\u003ehere\u003c/a\u003e.\u003cbr\u003e\u003cbr\u003e"
      },
      {
        "type": "SELECT",
        "name": "userDataFromVariable",
        "displayName": "Load Properties From Variable",
        "macrosInSelect": true,
        "selectItems": [
          {
            "value": false,
            "displayValue": "False"
          }
        ],
        "simpleValueType": true,
        "help": "You can use a standard User-Provided Data variable or create a variable that returns a JavaScript object with the desired user data properties. This object will merge with additional properties from the table below, with any conflicts resolved in favor of the table entries."
      },
      {
        "name": "userDataList",
        "simpleTableColumns": [
          {
            "valueValidators": [
              {
                "type": "NON_EMPTY"
              }
            ],
            "defaultValue": "em",
            "displayName": "Property Name",
            "name": "name",
            "isUnique": true,
            "type": "SELECT",
            "selectItems": [
              {
                "value": "em",
                "displayValue": "Email"
              },
              {
                "value": "ph",
                "displayValue": "Phone"
              },
              {
                "value": "ge",
                "displayValue": "Gender"
              },
              {
                "value": "db",
                "displayValue": "Date of Birth"
              },
              {
                "value": "ln",
                "displayValue": "Last Name"
              },
              {
                "value": "fn",
                "displayValue": "First Name"
              },
              {
                "value": "ct",
                "displayValue": "City"
              },
              {
                "value": "st",
                "displayValue": "State"
              },
              {
                "value": "zp",
                "displayValue": "Zip"
              },
              {
                "value": "country",
                "displayValue": "Country"
              },
              {
                "value": "external_id",
                "displayValue": "External ID"
              }
            ]
          },
          {
            "defaultValue": "",
            "displayName": "Property Value",
            "name": "value",
            "type": "TEXT"
          }
        ],
        "type": "SIMPLE_TABLE",
        "newRowButtonText": "Add property"
      }
    ],
    "enablingConditions": [
      {
        "paramName": "enableEdvancedMatching",
        "paramValue": true,
        "type": "EQUALS"
      }
    ]
  },
  {
    "displayName": "Object Properties",
    "name": "objectPropertiesGroup",
    "groupStyle": "ZIPPY_CLOSED",
    "type": "GROUP",
    "subParams": [
      {
        "type": "LABEL",
        "name": "objectPropertiesLabel",
        "displayName": "Standard Object Properties that you can send to Meta can be found \u003ca target\u003d\"_blank\" href\u003d\"https://developers.facebook.com/docs/meta-pixel/reference#object-properties\"\u003ehere\u003c/a\u003e.\u003cbr\u003e\u003cbr\u003e"
      },
      {
        "type": "SELECT",
        "name": "objectPropertiesFromVariable",
        "displayName": "Load Properties From Variable",
        "macrosInSelect": true,
        "selectItems": [
          {
            "value": false,
            "displayValue": "False"
          }
        ],
        "simpleValueType": true,
        "help": "You can create a variable that returns a JavaScript object with the desired properties. This object will merge with additional properties from the table below, with any conflicts resolved in favor of the table entries."
      },
      {
        "name": "objectPropertiesList",
        "simpleTableColumns": [
          {
            "valueValidators": [],
            "defaultValue": "",
            "displayName": "Property Name",
            "name": "name",
            "isUnique": true,
            "type": "TEXT"
          },
          {
            "defaultValue": "",
            "displayName": "Property Value",
            "name": "value",
            "type": "TEXT"
          }
        ],
        "type": "SIMPLE_TABLE",
        "newRowButtonText": "Add property"
      }
    ]
  },
  {
    "type": "GROUP",
    "name": "serverGroup",
    "displayName": "Server Side Tracking",
    "groupStyle": "ZIPPY_CLOSED",
    "subParams": [
      {
        "type": "TEXT",
        "name": "eventId",
        "displayName": "Event ID",
        "simpleValueType": true,
        "help": "Set the Event ID parameter in case you are tracking the same event via server-side using the Meta Conversions API.\n\u003cbr/\u003e\nThe Event ID can be used to deduplicate the same event if sent from multiple sources. \n\u003cbr/\u003e\n\u003ca href\u003d\"https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events/\"\u003eLearn more\u003c/a\u003e."
      },
      {
        "type": "GROUP",
        "name": "advancedSettingsGroup",
        "displayName": "Advanced Settings",
        "groupStyle": "ZIPPY_OPEN_ON_PARAM",
        "subParams": [
          {
            "type": "CHECKBOX",
            "name": "dataLayerEventPush",
            "checkboxText": "Push event to DataLayer with this Event ID",
            "simpleValueType": true,
            "help": "Helpful for easier events deduplication.",
            "defaultValue": false
          },
          {
            "type": "TEXT",
            "name": "dataLayerEventName",
            "displayName": "DataLayer Event Name",
            "simpleValueType": true,
            "enablingConditions": [
              {
                "paramName": "dataLayerEventPush",
                "paramValue": true,
                "type": "EQUALS"
              }
            ],
            "valueValidators": [
              {
                "type": "NON_EMPTY"
              }
            ],
            "valueHint": "page_view_unique"
          },
          {
            "type": "TEXT",
            "name": "dataLayerVariableName",
            "displayName": "DataLayer Object Name",
            "simpleValueType": true,
            "enablingConditions": [
              {
                "paramName": "dataLayerEventPush",
                "paramValue": true,
                "type": "EQUALS"
              }
            ],
            "valueValidators": [
              {
                "type": "NON_EMPTY"
              }
            ],
            "defaultValue": "dataLayer",
            "help": "Use dataLayer by default. Modify only if you renamed dataLayer object name."
          }
        ]
      }
    ]
  },
  {
    "type": "GROUP",
    "name": "otherSettingsGroup",
    "displayName": "Other Settings",
    "groupStyle": "ZIPPY_CLOSED",
    "subParams": [
      {
        "help": "Facebook automatically collects metadata and user interactions (e.g., clicks). Check this box to disable this functionality.",
        "simpleValueType": true,
        "name": "disableAutoConfig",
        "checkboxText": "Disable Automatic Configuration",
        "type": "CHECKBOX"
      },
      {
        "type": "CHECKBOX",
        "name": "disablePushState",
        "checkboxText": "Disable History Event Tracking",
        "simpleValueType": true,
        "help": "The Facebook Pixel automatically tracks history events (pushState and replaceState) as PageViews. Check this box to disable this automatic tracking."
      },
      {
        "type": "CHECKBOX",
        "name": "enableParamBuilderSdk",
        "checkboxText": "Increase Browser ID and Click ID Cookies Coverage",
        "simpleValueType": true,
        "defaultValue": true,
        "help": "When enabled, the Parameter Builder SDK library will be loaded. This library helps retrieving and saving the Browser ID (\u003ci\u003e_fbp\u003c/i\u003e cookie) and Click ID (\u003ci\u003e_fbc\u003c/i\u003e cookie) values into cookies, and it also tries to retrieve a backup Click ID from in-app-browser when feasible.\n\u003cbr/\u003e\u003cbr/\u003e\n\u003ca href\u003d\"https://developers.facebook.com/docs/marketing-api/conversions-api/parameter-builder-library\"\u003eLearn more\u003c/a\u003e.",
        "alwaysInSummary": true
      }
    ]
  }
]


___SANDBOXED_JS_FOR_WEB_TEMPLATE___

const addConsentListener = require('addConsentListener');
const callInWindow = require('callInWindow');
const copyFromDataLayer = require('copyFromDataLayer');
const copyFromWindow = require('copyFromWindow');
const encodeUriComponent = require('encodeUriComponent');
const getCookieValues = require('getCookieValues');
const getTimestampMillis = require('getTimestampMillis');
const getType = require('getType');
const getUrl = require('getUrl');
const isConsentGranted = require('isConsentGranted');
const JSON = require('JSON');
const localStorage = require('localStorage');
const makeNumber = require('makeNumber');
const makeString = require('makeString');
const makeTableMap = require('makeTableMap');
const math = require('Math');
const Object = require('Object');
const sendPixel = require('sendPixel');
const sha256 = require('sha256');
const templateStorage = require('templateStorage');

// Call-once methods.
let gtmOnSuccess = () => {
  gtmOnSuccess = () => {};
  return data.gtmOnSuccess();
};

let gtmOnFailure = () => {
  gtmOnFailure = () => {};
  return data.gtmOnFailure();
};

/*==============================================================================
==============================================================================*/

const isConsentRevoked = data.enableConsentMode
  ? !isConsentGranted('ad_storage')
  : data.consent === false;

sendEvent(isConsentRevoked);

if (isConsentRevoked) {
  // If consent is revoked, call gtmOnSuccess to avoid 'Still running' status.
  return gtmOnSuccess();
}

/*==============================================================================
  Vendor related functions
==============================================================================*/

function runOnConsentGranted(consentType, isConsentRevoked, callback) {
  if (data.enableConsentMode) {
    if (isConsentRevoked) {
      const callbacksKey = 'fbq_consent_callbacks_' + consentType;
      const callbacks = templateStorage.getItem(callbacksKey) || [];
      callbacks.push(callback);
      templateStorage.setItem(callbacksKey, callbacks);

      const listenerAddedKey = 'fbq_consent_listener_added_' + consentType;
      if (!templateStorage.getItem(listenerAddedKey)) {
        templateStorage.setItem(listenerAddedKey, true);
        addConsentListener(consentType, (type, granted) => {
          if (type !== consentType || !granted) return;
          const queuedCallbacks = templateStorage.getItem(callbacksKey) || [];
          templateStorage.setItem(callbacksKey, []);
          queuedCallbacks.forEach((cb) => cb());
        });
      }
    } else {
      callback();
    }
    return;
  }

  // Manual consent
  if (!isConsentRevoked) callback();
}

function sendToCollector(pixelId, eventName, eventData, userData, eventId) {
  const url = data.collectorUrl;
  if (!url) return;

  const fbpArr = getCookieValues('_fbp');
  const fbcArr = getCookieValues('_fbc');

  const payload = {
    source: 'browser',
    pixel_id: pixelId,
    event_name: eventName,
    event_id: eventId,
    event_time: math.round(getTimestampMillis() / 1000),
    fbp: fbpArr && fbpArr.length ? fbpArr[0] : undefined,
    fbc: fbcArr && fbcArr.length ? fbcArr[0] : undefined,
    page_url: getUrl()
  };
  if (data.forwardUserData && getType(userData) === 'object') payload.user_data = userData;
  if (data.forwardCustomData && getType(eventData) === 'object') payload.custom_data = eventData;

  // In WEB GTM templates the only sanctioned network transport is sendPixel (GET):
  // navigator.sendBeacon cannot be imported (access_globals forbids keys that start
  // with a predefined Window global, e.g. "navigator").
  sendCollectorPixel(url, payload);
}

function sendCollectorPixel(url, payload) {
  const sep = url.indexOf('?') === -1 ? '?' : '&';
  const qs =
    'source=browser' +
    '&event_name=' + encodeUriComponent(payload.event_name || '') +
    '&event_id=' + encodeUriComponent(payload.event_id || '') +
    '&event_time=' + encodeUriComponent(makeString(payload.event_time || '')) +
    '&fbp=' + encodeUriComponent(payload.fbp || '') +
    '&fbc=' + encodeUriComponent(payload.fbc || '') +
    '&d=' + encodeUriComponent(JSON.stringify(payload));
  sendPixel(url + sep + qs, gtmOnSuccess, gtmOnFailure);
}

function sendEvent(isConsentRevoked) {
  const pixelIds = data.pixelIds || '';
  const eventName = getEventName();
  const eventData = getEventData(eventName);
  const userData = getUserData(isConsentRevoked);

  pixelIds.split(',').forEach((pixelId) => {
    if (!data.collectorUrl) return;
    runOnConsentGranted('ad_storage', isConsentRevoked, () => {
      sendToCollector(pixelId, eventName, eventData, userData, data.eventId);
    });
  });
}

function getEventName() {
  if (data.inheritEventName === 'inherit') {
    let eventName = copyFromDataLayer('event');

    if (!eventName) {
      const ecommerceDataLayer = copyFromDataLayer('ecommerce', 1);
      if (ecommerceDataLayer.detail) eventName = 'ViewContent';
      else if (ecommerceDataLayer.add) eventName = 'AddToCart';
      else if (ecommerceDataLayer.checkout) eventName = 'InitiateCheckout';
      else if (ecommerceDataLayer.purchase) eventName = 'Purchase';
    }

    const mapFacebookEventName = {
      page_view: 'PageView',
      'gtm.dom': 'PageView',
      add_payment_info: 'AddPaymentInfo',
      add_to_cart: 'AddToCart',
      add_to_wishlist: 'AddToWishlist',
      sign_up: 'CompleteRegistration',
      begin_checkout: 'InitiateCheckout',
      generate_lead: 'Lead',
      purchase: 'Purchase',
      search: 'Search',
      view_item: 'ViewContent',

      contact: 'Contact',
      customize_product: 'CustomizeProduct',
      donate: 'Donate',
      find_location: 'FindLocation',
      schedule: 'Schedule',
      start_trial: 'StartTrial',
      submit_application: 'SubmitApplication',
      subscribe: 'Subscribe',

      page_view_stape: 'PageView',
      add_payment_info_stape: 'AddPaymentInfo',
      add_to_cart_stape: 'AddToCart',
      sign_up_stape: 'CompleteRegistration',
      begin_checkout_stape: 'InitiateCheckout',
      purchase_stape: 'Purchase',
      view_item_stape: 'ViewContent',

      'gtm4wp.addProductToCartEEC': 'AddToCart',
      'gtm4wp.productClickEEC': 'ViewContent',
      'gtm4wp.checkoutOptionEEC': 'InitiateCheckout',
      'gtm4wp.checkoutStepEEC': 'AddPaymentInfo',
      'gtm4wp.orderCompletedEEC': 'Purchase'
    };

    if (!mapFacebookEventName[eventName]) {
      return eventName;
    }

    return mapFacebookEventName[eventName];
  }

  return data.eventName === 'standard' ? data.eventNameStandard : data.eventNameCustom;
}

function getUserData(isConsentRevoked) {
  if (!data.enableEdvancedMatching) {
    return;
  }

  let userData = {};

  if (data.enableEventEnhancement) {
    userData = getEventEnhancement(isConsentRevoked);
  }

  if (data.enableDataLayerMapping) {
    let userDataFromDataLayer = getDL('user_data');

    if (getType(userDataFromDataLayer) === 'object') {
      parseUserData(userData, userDataFromDataLayer, true);
    }
  }

  if (getType(data.userDataFromVariable) === 'object') {
    parseUserData(userData, data.userDataFromVariable, false);
  }

  if (data.userDataList && data.userDataList.length) {
    userData = mergeObjects(userData, makeTableMap(data.userDataList, 'name', 'value'));
  }

  if (objIsEmptyOrContainsOnlyFalsyValues(userData)) {
    return;
  }

  if (data.enableEventEnhancement) {
    storeEventEnhancement(isConsentRevoked, userData);
  }

  return userData;
}

function getEventData(eventName) {
  let objectProperties = {};

  if (data.enableDataLayerMapping) {
    let ecommerce = getDL('ecommerce');
    if (getType(ecommerce) !== 'object') {
      ecommerce = {};
    }

    objectProperties = getUAEventData(eventName, objectProperties, ecommerce);

    if (!objectProperties.content_type) {
      objectProperties = getGA4EventData(eventName, objectProperties, ecommerce);
    }
  }

  if (getType(data.objectPropertiesFromVariable) === 'object') {
    mergeObjects(objectProperties, data.objectPropertiesFromVariable);
  }

  if (data.objectPropertiesList && data.objectPropertiesList.length) {
    objectProperties = mergeObjects(
      objectProperties,
      makeTableMap(data.objectPropertiesList, 'name', 'value')
    );
  }

  return objectProperties;
}

function getEventEnhancement(isConsentRevoked) {
  if (!isConsentRevoked && localStorage) {
    const gtmeec = localStorage.getItem('gtmeec');

    if (gtmeec) {
      const gtmeecParsed = JSON.parse(gtmeec);

      if (getType(gtmeecParsed) === 'object') {
        return gtmeecParsed;
      }
    }
  }

  return {};
}

function normalizeBasedOnSchemaKey(schemaKey, identifier) {
  if (schemaKey === 'ph') return normalizePhoneNumber(identifier);
  else if (schemaKey === 'ct' || schemaKey === 'st' || schemaKey === 'zp') {
    return removeWhiteSpace(identifier);
  } else return identifier;
}

function hashUserDataFields(userData, storeUserDataInLocalStorage) {
  const canUseHashSync = getType(copyFromWindow('dataTag256')) === 'function';
  const hashAsyncHelpers = {
    pendingHashs: 0,
    maybeFinish: (userDataHashed) => {
      if (hashAsyncHelpers.pendingHashs === 0) storeUserDataInLocalStorage(userDataHashed);
    }
  };

  const userDataHashed = {};

  const fieldNames = Object.keys(userData);
  fieldNames.forEach((fieldName) => {
    const value = userData[fieldName];

    if (value === undefined || value === null || value === '') return;
    if (isHashed(value)) {
      userDataHashed[fieldName] = value;
      return;
    }

    const normalizedValue = makeString(normalizeBasedOnSchemaKey(fieldName, value))
      .toLowerCase()
      .trim();
    if (canUseHashSync) {
      userDataHashed[fieldName] = callInWindow('dataTag256', normalizedValue, 'HEX');
    } else {
      hashAsyncHelpers.pendingHashs++;
      sha256(
        normalizedValue,
        (digest) => {
          userDataHashed[fieldName] = digest;
          hashAsyncHelpers.pendingHashs--;
          hashAsyncHelpers.maybeFinish(userDataHashed);
        },
        () => {
          hashAsyncHelpers.pendingHashs--;
        },
        { outputEncoding: 'hex' }
      );
    }
  });

  if (canUseHashSync) {
    storeUserDataInLocalStorage(userDataHashed);
    return userDataHashed;
  } else {
    hashAsyncHelpers.maybeFinish(userDataHashed);
    return;
  }
}

function storeUserDataInLocalStorage(userData) {
  if (!objHasProps(userData)) return;
  const gtmeec = JSON.stringify(userData);
  localStorage.setItem('gtmeec', gtmeec);
}

function storeEventEnhancement(isConsentRevoked, userData) {
  if (!isConsentRevoked && localStorage && objHasProps(userData)) {
    if (!data.storeUserDataHashed) storeUserDataInLocalStorage(userData);
    else hashUserDataFields(userData, storeUserDataInLocalStorage);
  }
}

function parseUserData(userData, userDataFrom, useDL) {
  let email =
    userDataFrom.email ||
    userDataFrom.sha256_email_address ||
    userDataFrom.email_address ||
    userDataFrom.em;
  const emailType = getType(email);
  if (emailType === 'array' || emailType === 'object') email = email[0];
  if (email) userData.em = email;

  let phone =
    userDataFrom.phone ||
    userDataFrom.sha256_phone_number ||
    userDataFrom.phone_number ||
    userDataFrom.ph;
  const phoneType = getType(phone);
  if (phoneType === 'array' || phoneType === 'object') phone = phone[0];
  if (phone) userData.ph = phone;

  const firstName =
    userDataFrom.firstName ||
    userDataFrom.nameFirst ||
    userDataFrom.first_name ||
    userDataFrom.fn ||
    (userDataFrom.address && userDataFrom.address.sha256_first_name
      ? userDataFrom.address.sha256_first_name
      : undefined) ||
    (userDataFrom.address && userDataFrom.address[0] && userDataFrom.address[0].sha256_first_name
      ? userDataFrom.address[0].sha256_first_name
      : undefined) ||
    (userDataFrom.address && userDataFrom.address.first_name
      ? userDataFrom.address.first_name
      : undefined) ||
    (userDataFrom.address && userDataFrom.address[0] && userDataFrom.address[0].first_name
      ? userDataFrom.address[0].first_name
      : undefined);
  if (firstName) userData.fn = firstName;

  const lastName =
    userDataFrom.lastName ||
    userDataFrom.nameLast ||
    userDataFrom.last_name ||
    userDataFrom.ln ||
    (userDataFrom.address && userDataFrom.address.sha256_last_name
      ? userDataFrom.address.sha256_last_name
      : undefined) ||
    (userDataFrom.address && userDataFrom.address[0] && userDataFrom.address[0].sha256_last_name
      ? userDataFrom.address[0].sha256_last_name
      : undefined) ||
    (userDataFrom.address && userDataFrom.address.last_name
      ? userDataFrom.address.last_name
      : undefined) ||
    (userDataFrom.address && userDataFrom.address[0] && userDataFrom.address[0].last_name
      ? userDataFrom.address[0].last_name
      : undefined);
  if (lastName) userData.ln = lastName;

  if (userDataFrom.ge) userData.ge = userDataFrom.ge;
  if (userDataFrom.db) userData.db = userDataFrom.db;

  const city =
    userDataFrom.city ||
    userDataFrom.ct ||
    (userDataFrom.address && userDataFrom.address.city ? userDataFrom.address.city : undefined) ||
    (userDataFrom.address && userDataFrom.address[0] && userDataFrom.address[0].city
      ? userDataFrom.address[0].city
      : undefined);
  if (city) userData.ct = city;

  const state =
    userDataFrom.state ||
    userDataFrom.region ||
    userDataFrom.st ||
    (userDataFrom.address && userDataFrom.address.state ? userDataFrom.address.state : undefined) ||
    (userDataFrom.address && userDataFrom.address[0] && userDataFrom.address[0].state
      ? userDataFrom.address[0].state
      : undefined) ||
    (userDataFrom.address && userDataFrom.address.region
      ? userDataFrom.address.region
      : undefined) ||
    (userDataFrom.address && userDataFrom.address[0] && userDataFrom.address[0].region
      ? userDataFrom.address[0].region
      : undefined);
  if (state) userData.st = state;

  const zip =
    userDataFrom.zip ||
    userDataFrom.postal_code ||
    userDataFrom.zp ||
    (userDataFrom.address && userDataFrom.address.postal_code
      ? userDataFrom.address.postal_code
      : undefined) ||
    (userDataFrom.address && userDataFrom.address[0] && userDataFrom.address[0].postal_code
      ? userDataFrom.address[0].postal_code
      : undefined) ||
    (userDataFrom.address && userDataFrom.address.zip ? userDataFrom.address.zip : undefined) ||
    (userDataFrom.address && userDataFrom.address[0] && userDataFrom.address[0].zip
      ? userDataFrom.address[0].zip
      : undefined);
  if (zip) userData.zp = zip;

  const country =
    userDataFrom.country ||
    (userDataFrom.address && userDataFrom.address.country
      ? userDataFrom.address.country
      : undefined) ||
    (userDataFrom.address && userDataFrom.address[0] && userDataFrom.address[0].country
      ? userDataFrom.address[0].country
      : undefined);
  if (country) userData.country = country;

  const externalId =
    userDataFrom.external_id ||
    userDataFrom.user_id ||
    userDataFrom.userId ||
    (useDL ? getDL('external_id') || getDL('user_id') || getDL('userId') || undefined : undefined);
  if (externalId) userData.external_id = externalId;

  return userData;
}

function getUAEventData(eventName, objectProperties, ecommerce) {
  const eventActionMap = {
    ViewContent: 'detail',
    AddToCart: 'add',
    InitiateCheckout: 'checkout',
    Purchase: 'purchase'
  };

  if (eventActionMap[eventName]) {
    const action = eventActionMap[eventName];

    if (
      ecommerce[action] &&
      ecommerce[action].products &&
      getType(ecommerce[action].products) === 'array'
    ) {
      objectProperties = {
        content_type: 'product',
        contents: ecommerce[action].products.map((prod) => ({
          id: prod.id,
          quantity: makeNumber(prod.quantity) || 1,
          item_price: makeNumber(prod.price)
        })),
        content_ids: ecommerce[action].products.map((prod) => prod.id),
        value: ecommerce[action].products.reduce((acc, cur) => {
          const curVal = math.round(makeNumber(cur.price || 0) * (cur.quantity || 1) * 100) / 100;
          return acc + curVal;
        }, 0.0),
        currency: ecommerce.currencyCode || 'USD'
      };

      if (['InitiateCheckout', 'Purchase'].indexOf(eventName) > -1)
        objectProperties.num_items = ecommerce[action].products.reduce((acc, cur) => {
          return acc + makeNumber(cur.quantity || 1);
        }, 0);
    }
  }

  return objectProperties;
}

function getGA4EventData(eventName, objectProperties, ecommerce) {
  const items = getDL('items') || ecommerce.items;
  let currencyFromItems = '';
  let valueFromItems = 0;

  if (items && items[0]) {
    objectProperties.contents = [];
    objectProperties.content_ids = [];
    objectProperties.content_type = 'product';
    if (['InitiateCheckout', 'Purchase'].indexOf(eventName) > -1) {
      objectProperties.num_items = 0;
    }
    currencyFromItems = items[0].currency;

    if (!items[1]) {
      if (items[0].item_name) objectProperties.content_name = items[0].item_name;
      if (items[0].item_category) objectProperties.content_category = items[0].item_category;
      if (items[0].price)
        objectProperties.value = items[0].quantity
          ? items[0].quantity * items[0].price
          : items[0].price;
    }

    items.forEach((d) => {
      const content = {};
      if (d.item_id) content.id = d.item_id;
      content.quantity = makeNumber(d.quantity) || 1;

      if (d.price) {
        const item_price = makeNumber(d.price);
        valueFromItems += d.quantity ? d.quantity * item_price : item_price;
        content.item_price = item_price;
      }

      objectProperties.contents.push(content);
      objectProperties.content_ids.push(content.id);
      if (['InitiateCheckout', 'Purchase'].indexOf(eventName) > -1) {
        objectProperties.num_items = objectProperties.num_items + content.quantity || 1;
      }
    });
  }

  const value = ecommerce.value || valueFromItems || getDL('value');
  if (value) objectProperties.value = value;

  const currency = ecommerce.currency || currencyFromItems || getDL('currency');
  if (currency) objectProperties.currency = currency;

  const searchTerm = getDL('search_term');
  if (searchTerm) objectProperties.search_string = searchTerm;

  if (eventName === 'Purchase') {
    if (!objectProperties.currency) objectProperties.currency = 'USD';
    if (!objectProperties.value) objectProperties.value = valueFromItems ? valueFromItems : 0;
  }

  return objectProperties;
}

function getDL(name) {
  const dataLayerVersion = data.enableCurrentDataLayerOnly ? 1 : 2;
  return copyFromDataLayer(name, dataLayerVersion);
}

/*==============================================================================
  Helpers
==============================================================================*/

function mergeObjects(obj1, obj2) {
  Object.keys(obj2).forEach((key) => {
    obj1[key] = obj2[key];
  });

  return obj1;
}

function objHasProps(obj) {
  return getType(obj) === 'object' && Object.keys(obj).length > 0;
}

function objIsEmptyOrContainsOnlyFalsyValues(obj) {
  if (getType(obj) !== 'object') return;
  const objValues = Object.values(obj);
  if (objValues.length === 0 || objValues.every((v) => !v)) return true;
}

function isHashed(value) {
  if (!value) return false;
  return makeString(value).match('^[A-Fa-f0-9]{64}$') !== null;
}

function normalizePhoneNumber(phoneNumber) {
  if (!phoneNumber) return phoneNumber;
  return makeString(phoneNumber)
    .split('+')
    .join('')
    .split(' ')
    .join('')
    .split('-')
    .join('')
    .split('(')
    .join('')
    .split(')')
    .join('');
}

function removeWhiteSpace(input) {
  if (!input) return input;
  return makeString(input).split(' ').join('');
}

function isMagento2Checkout() {
  const checkoutConfig = copyFromWindow('checkoutConfig');

  return (
    getType(checkoutConfig) === 'object' &&
    getType(checkoutConfig.quoteData) === 'object' &&
    checkoutConfig.hasOwnProperty('defaultSuccessPageUrl') &&
    checkoutConfig.hasOwnProperty('storeCode')
  );
}


___WEB_PERMISSIONS___

[
  {
    "instance": {
      "key": {
        "publicId": "access_globals",
        "versionId": "1"
      },
      "param": [
        {
          "key": "keys",
          "value": {
            "type": 2,
            "listItem": [
              {
                "type": 3,
                "mapKey": [
                  {
                    "type": 1,
                    "string": "key"
                  },
                  {
                    "type": 1,
                    "string": "read"
                  },
                  {
                    "type": 1,
                    "string": "write"
                  },
                  {
                    "type": 1,
                    "string": "execute"
                  }
                ],
                "mapValue": [
                  {
                    "type": 1,
                    "string": "_fbq"
                  },
                  {
                    "type": 8,
                    "boolean": false
                  },
                  {
                    "type": 8,
                    "boolean": true
                  },
                  {
                    "type": 8,
                    "boolean": false
                  }
                ]
              },
              {
                "type": 3,
                "mapKey": [
                  {
                    "type": 1,
                    "string": "key"
                  },
                  {
                    "type": 1,
                    "string": "read"
                  },
                  {
                    "type": 1,
                    "string": "write"
                  },
                  {
                    "type": 1,
                    "string": "execute"
                  }
                ],
                "mapValue": [
                  {
                    "type": 1,
                    "string": "dataTag256"
                  },
                  {
                    "type": 8,
                    "boolean": true
                  },
                  {
                    "type": 8,
                    "boolean": false
                  },
                  {
                    "type": 8,
                    "boolean": true
                  }
                ]
              },
              {
                "type": 3,
                "mapKey": [
                  {
                    "type": 1,
                    "string": "key"
                  },
                  {
                    "type": 1,
                    "string": "read"
                  },
                  {
                    "type": 1,
                    "string": "write"
                  },
                  {
                    "type": 1,
                    "string": "execute"
                  }
                ],
                "mapValue": [
                  {
                    "type": 1,
                    "string": "checkoutConfig"
                  },
                  {
                    "type": 8,
                    "boolean": true
                  },
                  {
                    "type": 8,
                    "boolean": false
                  },
                  {
                    "type": 8,
                    "boolean": false
                  }
                ]
              }
            ]
          }
        }
      ]
    },
    "clientAnnotations": {
      "isEditedByUser": true
    },
    "isRequired": true
  },
  {
    "instance": {
      "key": {
        "publicId": "read_data_layer",
        "versionId": "1"
      },
      "param": [
        {
          "key": "allowedKeys",
          "value": {
            "type": 1,
            "string": "any"
          }
        }
      ]
    },
    "clientAnnotations": {
      "isEditedByUser": true
    },
    "isRequired": true
  },
  {
    "instance": {
      "key": {
        "publicId": "access_local_storage",
        "versionId": "1"
      },
      "param": [
        {
          "key": "keys",
          "value": {
            "type": 2,
            "listItem": [
              {
                "type": 3,
                "mapKey": [
                  {
                    "type": 1,
                    "string": "key"
                  },
                  {
                    "type": 1,
                    "string": "read"
                  },
                  {
                    "type": 1,
                    "string": "write"
                  }
                ],
                "mapValue": [
                  {
                    "type": 1,
                    "string": "gtmeec"
                  },
                  {
                    "type": 8,
                    "boolean": true
                  },
                  {
                    "type": 8,
                    "boolean": true
                  }
                ]
              }
            ]
          }
        }
      ]
    },
    "clientAnnotations": {
      "isEditedByUser": true
    },
    "isRequired": true
  },
  {
    "instance": {
      "key": {
        "publicId": "access_consent",
        "versionId": "1"
      },
      "param": [
        {
          "key": "consentTypes",
          "value": {
            "type": 2,
            "listItem": [
              {
                "type": 3,
                "mapKey": [
                  {
                    "type": 1,
                    "string": "consentType"
                  },
                  {
                    "type": 1,
                    "string": "read"
                  },
                  {
                    "type": 1,
                    "string": "write"
                  }
                ],
                "mapValue": [
                  {
                    "type": 1,
                    "string": "ad_storage"
                  },
                  {
                    "type": 8,
                    "boolean": true
                  },
                  {
                    "type": 8,
                    "boolean": false
                  }
                ]
              }
            ]
          }
        }
      ]
    },
    "clientAnnotations": {
      "isEditedByUser": true
    },
    "isRequired": true
  },
  {
    "instance": {
      "key": {
        "publicId": "access_template_storage",
        "versionId": "1"
      },
      "param": []
    },
    "isRequired": true
  },
  {
    "instance": {
      "key": {
        "publicId": "get_cookies",
        "versionId": "1"
      },
      "param": [
        {
          "key": "cookieAccess",
          "value": {
            "type": 1,
            "string": "specific"
          }
        },
        {
          "key": "cookieNames",
          "value": {
            "type": 2,
            "listItem": [
              {
                "type": 1,
                "string": "_fbp"
              },
              {
                "type": 1,
                "string": "_fbc"
              }
            ]
          }
        }
      ]
    },
    "isRequired": true
  },
  {
    "instance": {
      "key": {
        "publicId": "send_pixel",
        "versionId": "1"
      },
      "param": [
        {
          "key": "allowedUrls",
          "value": {
            "type": 1,
            "string": "any"
          }
        }
      ]
    },
    "isRequired": true
  },
  {
    "instance": {
      "key": {
        "publicId": "get_url",
        "versionId": "1"
      },
      "param": [
        {
          "key": "urlParts",
          "value": {
            "type": 1,
            "string": "any"
          }
        },
        {
          "key": "queriesAllowed",
          "value": {
            "type": 1,
            "string": "any"
          }
        }
      ]
    },
    "isRequired": true
  }
]


___TESTS___

scenarios:
- name: '[Happy Path] PageView fires init, agent, trackSingle and injects both scripts'
  code: |-
    runCode(mockData);

    const consentGrants = fbqCalls.filter((c) => c[0] === 'consent' && c[1] === 'grant');
    assertThat(consentGrants.length).isGreaterThan(0);

    const initCalls = fbqCalls.filter((c) => c[0] === 'init');
    assertThat(initCalls.length).isEqualTo(1);
    assertThat(initCalls[0][1]).isEqualTo('123456789');

    const agentCalls = fbqCalls.filter((c) => c[0] === 'set' && c[1] === 'agent');
    assertThat(agentCalls.length).isEqualTo(1);
    assertThat(agentCalls[0][2]).isEqualTo(PARTNER_AGENT_VERSION + '-pb');
    assertThat(agentCalls[0][3]).isEqualTo('123456789');

    const trackCalls = fbqCalls.filter((c) => c[0] === 'trackSingle');
    assertThat(trackCalls.length).isEqualTo(1);
    assertThat(trackCalls[0][1]).isEqualTo('123456789');
    assertThat(trackCalls[0][2]).isEqualTo('PageView');

    assertThat(injectScriptCalls.length).isEqualTo(2);
    assertThat(injectScriptCalls[0].url).isEqualTo('https://connect.facebook.net/en_US/fbevents.js');
    assertThat(injectScriptCalls[1].url).isEqualTo('https://unpkg.com/meta-capi-param-builder-clientjs/dist/clientParamBuilder.bundle.js');

    assertApi('gtmOnSuccess').wasCalled();
    assertApi('gtmOnFailure').wasNotCalled();
- name: '[Multiple Pixels] Each pixel gets separate init, agent, and track calls'
  code: |-
    mockData.pixelIds = '111,222,333';

    runCode(mockData);

    const initCalls = fbqCalls.filter((c) => c[0] === 'init');
    assertThat(initCalls.length).isEqualTo(3);
    assertThat(initCalls[0][1]).isEqualTo('111');
    assertThat(initCalls[1][1]).isEqualTo('222');
    assertThat(initCalls[2][1]).isEqualTo('333');

    const trackCalls = fbqCalls.filter((c) => c[0] === 'trackSingle');
    assertThat(trackCalls.length).isEqualTo(3);
    assertThat(trackCalls[0][1]).isEqualTo('111');
    assertThat(trackCalls[1][1]).isEqualTo('222');
    assertThat(trackCalls[2][1]).isEqualTo('333');

    const agentCalls = fbqCalls.filter((c) => c[0] === 'set' && c[1] === 'agent');
    assertThat(agentCalls.length).isEqualTo(3);

    assertApi('gtmOnSuccess').wasCalled();
    assertApi('gtmOnFailure').wasNotCalled();
- name: '[Consent] Manual consent=false revokes fbq and calls gtmOnSuccess without
    scripts'
  code: |-
    mockData.consent = false;

    runCode(mockData);

    const revokeCalls = fbqCalls.filter((c) => c[0] === 'consent' && c[1] === 'revoke');
    assertThat(revokeCalls.length).isEqualTo(1);

    const grantCalls = fbqCalls.filter((c) => c[0] === 'consent' && c[1] === 'grant');
    assertThat(grantCalls.length).isEqualTo(0);

    assertThat(injectScriptCalls.length).isEqualTo(0);

    assertApi('gtmOnSuccess').wasCalled();
    assertApi('gtmOnFailure').wasNotCalled();
- name: '[Consent] GTM consent mode denied revokes and calls gtmOnSuccess without
    scripts'
  code: |-
    mockData.enableConsentMode = true;
    mock('isConsentGranted', () => false);

    runCode(mockData);

    const revokeCalls = fbqCalls.filter((c) => c[0] === 'consent' && c[1] === 'revoke');
    assertThat(revokeCalls.length).isEqualTo(1);

    assertThat(injectScriptCalls.length).isEqualTo(0);

    assertApi('addConsentListener').wasCalled();
    assertApi('gtmOnSuccess').wasCalled();
    assertApi('gtmOnFailure').wasNotCalled();
- name: '[Consent] Listener fires queued callbacks when consent is later granted'
  code: |-
    mockData.enableConsentMode = true;
    mock('isConsentGranted', () => false);

    let consentListenerCallback;
    mock('addConsentListener', (type, callback) => {
      consentListenerCallback = callback;
    });

    runCode(mockData);

    assertThat(injectScriptCalls.length).isEqualTo(0);
    assertApi('gtmOnSuccess').wasCalled();
    assertApi('gtmOnFailure').wasNotCalled();

    consentListenerCallback('ad_storage', true);

    assertThat(injectScriptCalls.length).isEqualTo(2);
    assertThat(injectScriptCalls[0].url).isEqualTo('https://connect.facebook.net/en_US/fbevents.js');

    const grantCalls = fbqCalls.filter((c) => c[0] === 'consent' && c[1] === 'grant');
    assertThat(grantCalls.length).isGreaterThan(0);
- name: '[Consent] setFbqConsent skips duplicate revoke when one is already queued'
  code: |-
    const mockFbqWithQueue = function() {
      const args = [];
      for (let i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
      }
      fbqCalls.push(args);
    };
    mockFbqWithQueue.queue = [['consent', 'revoke']];

    mock('copyFromWindow', (key) => {
      if (key === 'fbq') return mockFbqWithQueue;
      return undefined;
    });

    mockData.consent = false;

    runCode(mockData);

    const revokeCalls = fbqCalls.filter((c) => c[0] === 'consent' && c[1] === 'revoke');
    assertThat(revokeCalls.length).isEqualTo(0);

    assertApi('gtmOnSuccess').wasCalled();
    assertApi('gtmOnFailure').wasNotCalled();
- name: '[Consent] LDU sets dataProcessingOptions with country and state'
  code: |-
    mockData.dpoLDU = true;
    mockData.dpoCountry = '1';
    mockData.dpoState = '1000';

    runCode(mockData);

    const dpoCalls = fbqCalls.filter((c) => c[0] === 'dataProcessingOptions');
    assertThat(dpoCalls.length).isEqualTo(1);
    assertThat(dpoCalls[0][1]).isEqualTo(['LDU']);
    assertThat(dpoCalls[0][2]).isEqualTo(1);
    assertThat(dpoCalls[0][3]).isEqualTo(1000);

    assertApi('gtmOnSuccess').wasCalled();
    assertApi('gtmOnFailure').wasNotCalled();
- name: '[Event Name] Maps GA4, stape, and gtm4wp events from DataLayer'
  code: |-
    [
      { dlEvent: 'page_view', expected: 'PageView' },
      { dlEvent: 'add_to_cart', expected: 'AddToCart' },
      { dlEvent: 'purchase', expected: 'Purchase' },
      { dlEvent: 'begin_checkout', expected: 'InitiateCheckout' },
      { dlEvent: 'view_item', expected: 'ViewContent' },
      { dlEvent: 'sign_up', expected: 'CompleteRegistration' },
      { dlEvent: 'generate_lead', expected: 'Lead' },
      { dlEvent: 'search', expected: 'Search' },
      { dlEvent: 'add_to_wishlist', expected: 'AddToWishlist' },
      { dlEvent: 'contact', expected: 'Contact' },
      { dlEvent: 'subscribe', expected: 'Subscribe' },
      { dlEvent: 'page_view_stape', expected: 'PageView' },
      { dlEvent: 'purchase_stape', expected: 'Purchase' },
      { dlEvent: 'add_to_cart_stape', expected: 'AddToCart' },
      { dlEvent: 'gtm4wp.orderCompletedEEC', expected: 'Purchase' },
      { dlEvent: 'gtm4wp.addProductToCartEEC', expected: 'AddToCart' },
      { dlEvent: 'gtm4wp.productClickEEC', expected: 'ViewContent' }
    ].forEach((scenario) => {
      fbqCalls = [];
      injectScriptCalls = [];

      const testData = assign(assign({}, mockData), { inheritEventName: 'inherit' });

      mock('copyFromDataLayer', (key) => {
        if (key === 'event') return scenario.dlEvent;
        return undefined;
      });

      mock('injectScript', (url, onsuccess) => {
        injectScriptCalls.push({ url: url });
        onsuccess();
      });

      runCode(testData);

      const trackCalls = fbqCalls.filter((c) => c[0] === 'trackSingle' || c[0] === 'trackSingleCustom');
      assertThat(trackCalls.length).isEqualTo(1);
      assertThat(trackCalls[0][2]).isEqualTo(scenario.expected);

      assertApi('gtmOnSuccess').wasCalled();
      assertApi('gtmOnFailure').wasNotCalled();
    });
- name: '[Event Name] Unmapped event from DataLayer passes through as-is'
  code: |-
    mockData.inheritEventName = 'inherit';

    mock('copyFromDataLayer', (key) => {
      if (key === 'event') return 'my_custom_dl_event';
      return undefined;
    });

    runCode(mockData);

    const trackCalls = fbqCalls.filter((c) => c[0] === 'trackSingleCustom');
    assertThat(trackCalls.length).isEqualTo(1);
    assertThat(trackCalls[0][2]).isEqualTo('my_custom_dl_event');

    assertApi('gtmOnSuccess').wasCalled();
    assertApi('gtmOnFailure').wasNotCalled();
- name: '[Event Name] UA ecommerce fallback when no DL event name'
  code: |-
    [
      { ecommerceKey: 'detail', expected: 'ViewContent' },
      { ecommerceKey: 'add', expected: 'AddToCart' },
      { ecommerceKey: 'checkout', expected: 'InitiateCheckout' },
      { ecommerceKey: 'purchase', expected: 'Purchase' }
    ].forEach((scenario) => {
      fbqCalls = [];
      injectScriptCalls = [];

      const testData = assign(assign({}, mockData), { inheritEventName: 'inherit' });
      const ecommerceData = {};
      ecommerceData[scenario.ecommerceKey] = true;

      mock('copyFromDataLayer', (key, version) => {
        if (key === 'event') return undefined;
        if (key === 'ecommerce' && version === 1) return ecommerceData;
        return undefined;
      });

      mock('injectScript', (url, onsuccess) => {
        injectScriptCalls.push({ url: url });
        onsuccess();
      });

      runCode(testData);

      const trackCalls = fbqCalls.filter((c) => c[0] === 'trackSingle');
      assertThat(trackCalls.length).isEqualTo(1);
      assertThat(trackCalls[0][2]).isEqualTo(scenario.expected);

      assertApi('gtmOnSuccess').wasCalled();
      assertApi('gtmOnFailure').wasNotCalled();
    });
- name: '[Event Name] Override with standard and custom event types'
  code: |-
    const testData1 = assign(assign({}, mockData), {
      inheritEventName: 'override',
      eventName: 'standard',
      eventNameStandard: 'AddToCart'
    });

    runCode(testData1);

    let trackCalls = fbqCalls.filter((c) => c[0] === 'trackSingle');
    assertThat(trackCalls.length).isEqualTo(1);
    assertThat(trackCalls[0][2]).isEqualTo('AddToCart');

    assertApi('gtmOnSuccess').wasCalled();
    assertApi('gtmOnFailure').wasNotCalled();

    fbqCalls = [];
    injectScriptCalls = [];

    const testData2 = assign(assign({}, mockData), {
      inheritEventName: 'override',
      eventName: 'custom',
      eventNameCustom: 'MyCustomEvent'
    });

    mock('injectScript', (url, onsuccess) => {
      injectScriptCalls.push({ url: url });
      onsuccess();
    });

    runCode(testData2);

    trackCalls = fbqCalls.filter((c) => c[0] === 'trackSingleCustom');
    assertThat(trackCalls.length).isEqualTo(1);
    assertThat(trackCalls[0][2]).isEqualTo('MyCustomEvent');

    assertApi('gtmOnSuccess').wasCalled();
    assertApi('gtmOnFailure').wasNotCalled();
- name: '[Pixel Init] Already initialized pixel skips re-init and settings'
  code: |-
    mock('copyFromWindow', (key) => {
      if (key === 'fbq') return mockFbq;
      if (key === '_meta_gtm_ids') return ['123456789'];
      return undefined;
    });

    runCode(mockData);

    const initCalls = fbqCalls.filter((c) => c[0] === 'init');
    assertThat(initCalls.length).isEqualTo(0);

    const autoConfigCalls = fbqCalls.filter((c) => c[0] === 'set' && c[1] === 'autoConfig');
    assertThat(autoConfigCalls.length).isEqualTo(0);

    const trackCalls = fbqCalls.filter((c) => c[0] === 'trackSingle');
    assertThat(trackCalls.length).isEqualTo(1);

    assertApi('gtmOnSuccess').wasCalled();
    assertApi('gtmOnFailure').wasNotCalled();
- name: '[Advanced Matching] User data from variable and table merged into init'
  code: |-
    const testData = assign(assign({}, mockData), {
      enableEdvancedMatching: true,
      userDataFromVariable: { email: 'test@example.com', phone: '1234567890' },
      userDataList: [{ name: 'fn', value: 'John' }, { name: 'ln', value: 'Doe' }]
    });

    runCode(testData);

    const initCalls = fbqCalls.filter((c) => c[0] === 'init');
    assertThat(initCalls.length).isEqualTo(1);

    const userData = initCalls[0][2];
    assertThat(userData.em).isEqualTo('test@example.com');
    assertThat(userData.ph).isEqualTo('1234567890');
    assertThat(userData.fn).isEqualTo('John');
    assertThat(userData.ln).isEqualTo('Doe');

    assertApi('gtmOnSuccess').wasCalled();
    assertApi('gtmOnFailure').wasNotCalled();
- name: '[Advanced Matching] runInitOnce prevents re-init for initialized pixel'
  code: |-
    const testData = assign(assign({}, mockData), {
      enableEdvancedMatching: true,
      runInitOnce: true,
      userDataFromVariable: { email: 'test@example.com' }
    });

    mock('copyFromWindow', (key) => {
      if (key === 'fbq') return mockFbq;
      if (key === '_meta_gtm_ids') return ['123456789'];
      return undefined;
    });

    runCode(testData);

    const initCalls = fbqCalls.filter((c) => c[0] === 'init');
    assertThat(initCalls.length).isEqualTo(0);

    const trackCalls = fbqCalls.filter((c) => c[0] === 'trackSingle');
    assertThat(trackCalls.length).isEqualTo(1);

    assertApi('gtmOnSuccess').wasCalled();
    assertApi('gtmOnFailure').wasNotCalled();
- name: '[User Data] Parses all fields from DataLayer user_data object'
  code: |-
    const testData = assign(assign({}, mockData), {
      enableEdvancedMatching: true,
      enableDataLayerMapping: true
    });

    mock('copyFromDataLayer', (key) => {
      if (key === 'user_data') return {
        email: 'dl@example.com',
        phone: '1555000000',
        firstName: 'Jane',
        lastName: 'Smith',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'US',
        external_id: 'ext123',
        ge: 'f',
        db: '19900101'
      };
      return undefined;
    });

    runCode(testData);

    const initCalls = fbqCalls.filter((c) => c[0] === 'init');
    const userData = initCalls[0][2];
    assertThat(userData.em).isEqualTo('dl@example.com');
    assertThat(userData.ph).isEqualTo('1555000000');
    assertThat(userData.fn).isEqualTo('Jane');
    assertThat(userData.ln).isEqualTo('Smith');
    assertThat(userData.ct).isEqualTo('New York');
    assertThat(userData.st).isEqualTo('NY');
    assertThat(userData.zp).isEqualTo('10001');
    assertThat(userData.country).isEqualTo('US');
    assertThat(userData.external_id).isEqualTo('ext123');
    assertThat(userData.ge).isEqualTo('f');
    assertThat(userData.db).isEqualTo('19900101');

    assertApi('gtmOnSuccess').wasCalled();
    assertApi('gtmOnFailure').wasNotCalled();
- name: '[User Data] Array email and phone values take the first element'
  code: |-
    const testData = assign(assign({}, mockData), {
      enableEdvancedMatching: true,
      userDataFromVariable: {
        email: ['first@example.com', 'second@example.com'],
        phone: ['111', '222']
      }
    });

    runCode(testData);

    const initCalls = fbqCalls.filter((c) => c[0] === 'init');
    const userData = initCalls[0][2];
    assertThat(userData.em).isEqualTo('first@example.com');
    assertThat(userData.ph).isEqualTo('111');

    assertApi('gtmOnSuccess').wasCalled();
    assertApi('gtmOnFailure').wasNotCalled();
- name: '[User Data] Address-nested fields are parsed correctly'
  code: |-
    const testData = assign(assign({}, mockData), {
      enableEdvancedMatching: true,
      userDataFromVariable: {
        address: {
          first_name: 'Nested',
          last_name: 'User',
          city: 'Boston',
          state: 'MA',
          postal_code: '02101',
          country: 'US'
        }
      }
    });

    runCode(testData);

    const initCalls = fbqCalls.filter((c) => c[0] === 'init');
    const userData = initCalls[0][2];
    assertThat(userData.fn).isEqualTo('Nested');
    assertThat(userData.ln).isEqualTo('User');
    assertThat(userData.ct).isEqualTo('Boston');
    assertThat(userData.st).isEqualTo('MA');
    assertThat(userData.zp).isEqualTo('02101');
    assertThat(userData.country).isEqualTo('US');

    assertApi('gtmOnSuccess').wasCalled();
    assertApi('gtmOnFailure').wasNotCalled();
- name: '[User Data] Empty or all-falsy user data returns undefined'
  code: |-
    [
      { description: 'empty object', userData: {} },
      { description: 'all-falsy values', userData: { email: '', phone: null } }
    ].forEach((scenario) => {
      fbqCalls = [];
      const testData = assign(assign({}, mockData), {
        enableEdvancedMatching: true,
        userDataFromVariable: scenario.userData
      });

      runCode(testData);

      const initCalls = fbqCalls.filter((c) => c[0] === 'init');
      assertThat(initCalls.length).isEqualTo(1);
      assertThat(initCalls[0][2]).isUndefined();

      assertApi('gtmOnSuccess').wasCalled();
      assertApi('gtmOnFailure').wasNotCalled();
    });
- name: '[User Data] External ID falls back to DataLayer when useDL is true'
  code: |-
    const testData = assign(assign({}, mockData), {
      enableEdvancedMatching: true,
      enableDataLayerMapping: true
    });

    mock('copyFromDataLayer', (key) => {
      if (key === 'user_data') return { email: 'test@example.com' };
      if (key === 'external_id') return 'dl-ext-id';
      return undefined;
    });

    runCode(testData);

    const initCalls = fbqCalls.filter((c) => c[0] === 'init');
    const userData = initCalls[0][2];
    assertThat(userData.external_id).isEqualTo('dl-ext-id');

    assertApi('gtmOnSuccess').wasCalled();
    assertApi('gtmOnFailure').wasNotCalled();
- name: '[Event Data] GA4 Purchase with multiple items builds correct properties'
  code: |-
    const testData = assign(assign({}, mockData), {
      eventNameStandard: 'Purchase',
      enableDataLayerMapping: true
    });

    mock('copyFromDataLayer', (key) => {
      if (key === 'items') return [
        { item_id: 'SKU1', item_name: 'Product 1', price: 10, quantity: 2, currency: 'EUR' },
        { item_id: 'SKU2', item_name: 'Product 2', price: 25, quantity: 1 }
      ];
      if (key === 'value') return 45;
      if (key === 'currency') return 'EUR';
      return undefined;
    });

    runCode(testData);

    const trackCalls = fbqCalls.filter((c) => c[0] === 'trackSingle');
    assertThat(trackCalls.length).isEqualTo(1);

    const eventData = trackCalls[0][3];
    assertThat(eventData.content_type).isEqualTo('product');
    assertThat(eventData.content_ids).isEqualTo(['SKU1', 'SKU2']);
    assertThat(eventData.contents.length).isEqualTo(2);
    assertThat(eventData.contents[0].id).isEqualTo('SKU1');
    assertThat(eventData.contents[0].quantity).isEqualTo(2);
    assertThat(eventData.contents[1].id).isEqualTo('SKU2');
    assertThat(eventData.contents[1].quantity).isEqualTo(1);
    assertThat(eventData.value).isEqualTo(45);
    assertThat(eventData.currency).isEqualTo('EUR');
    assertThat(eventData.num_items).isDefined();

    assertApi('gtmOnSuccess').wasCalled();
    assertApi('gtmOnFailure').wasNotCalled();
- name: '[Event Data] GA4 single item includes content_name and content_category'
  code: |-
    const testData = assign(assign({}, mockData), {
      eventNameStandard: 'ViewContent',
      enableDataLayerMapping: true
    });

    mock('copyFromDataLayer', (key) => {
      if (key === 'items') return [
        { item_id: 'SINGLE1', item_name: 'My Product', item_category: 'Electronics', price: 99, quantity: 1 }
      ];
      return undefined;
    });

    runCode(testData);

    const trackCalls = fbqCalls.filter((c) => c[0] === 'trackSingle');
    const eventData = trackCalls[0][3];
    assertThat(eventData.content_name).isEqualTo('My Product');
    assertThat(eventData.content_category).isEqualTo('Electronics');
    assertThat(eventData.content_type).isEqualTo('product');

    assertApi('gtmOnSuccess').wasCalled();
    assertApi('gtmOnFailure').wasNotCalled();
- name: '[Event Data] UA Purchase with products builds correct properties'
  code: |-
    const testData = assign(assign({}, mockData), {
      eventNameStandard: 'Purchase',
      enableDataLayerMapping: true
    });

    mock('copyFromDataLayer', (key) => {
      if (key === 'ecommerce') return {
        currencyCode: 'GBP',
        purchase: {
          products: [
            { id: 'P1', price: '15.99', quantity: '3' },
            { id: 'P2', price: '8.50', quantity: '1' }
          ]
        }
      };
      return undefined;
    });

    runCode(testData);

    const trackCalls = fbqCalls.filter((c) => c[0] === 'trackSingle');
    assertThat(trackCalls.length).isEqualTo(1);

    const eventData = trackCalls[0][3];
    assertThat(eventData.content_type).isEqualTo('product');
    assertThat(eventData.content_ids).isEqualTo(['P1', 'P2']);
    assertThat(eventData.currency).isEqualTo('GBP');
    assertThat(eventData.contents.length).isEqualTo(2);
    assertThat(eventData.num_items).isDefined();

    assertApi('gtmOnSuccess').wasCalled();
    assertApi('gtmOnFailure').wasNotCalled();
- name: '[Event Data] Properties from variable and table list merge correctly'
  code: |-
    const testData = assign(assign({}, mockData), {
      objectPropertiesFromVariable: { content_name: 'My Product', value: 99 },
      objectPropertiesList: [
        { name: 'currency', value: 'USD' },
        { name: 'content_type', value: 'product' }
      ]
    });

    runCode(testData);

    const trackCalls = fbqCalls.filter((c) => c[0] === 'trackSingle');
    const eventData = trackCalls[0][3];
    assertThat(eventData.content_name).isEqualTo('My Product');
    assertThat(eventData.value).isEqualTo(99);
    assertThat(eventData.currency).isEqualTo('USD');
    assertThat(eventData.content_type).isEqualTo('product');

    assertApi('gtmOnSuccess').wasCalled();
    assertApi('gtmOnFailure').wasNotCalled();
- name: '[Event Data] GA4 Search event includes search_string'
  code: |-
    const testData = assign(assign({}, mockData), {
      eventNameStandard: 'Search',
      enableDataLayerMapping: true
    });

    mock('copyFromDataLayer', (key) => {
      if (key === 'search_term') return 'blue shoes';
      return undefined;
    });

    runCode(testData);

    const trackCalls = fbqCalls.filter((c) => c[0] === 'trackSingle');
    const eventData = trackCalls[0][3];
    assertThat(eventData.search_string).isEqualTo('blue shoes');

    assertApi('gtmOnSuccess').wasCalled();
    assertApi('gtmOnFailure').wasNotCalled();
- name: '[Event Data] GA4 Purchase defaults currency to USD and value to 0'
  code: |-
    const testData = assign(assign({}, mockData), {
      eventNameStandard: 'Purchase',
      enableDataLayerMapping: true
    });

    mock('copyFromDataLayer', () => undefined);

    runCode(testData);

    const trackCalls = fbqCalls.filter((c) => c[0] === 'trackSingle');
    const eventData = trackCalls[0][3];
    assertThat(eventData.currency).isEqualTo('USD');
    assertThat(eventData.value).isEqualTo(0);

    assertApi('gtmOnSuccess').wasCalled();
    assertApi('gtmOnFailure').wasNotCalled();
- name: '[Settings] disableAutoConfig and disablePushState are applied correctly'
  code: |-
    const testData = assign(assign({}, mockData), {
      disableAutoConfig: true,
      disablePushState: true
    });

    runCode(testData);

    const autoConfigCalls = fbqCalls.filter((c) => c[0] === 'set' && c[1] === 'autoConfig');
    assertThat(autoConfigCalls.length).isEqualTo(1);
    assertThat(autoConfigCalls[0][2]).isFalse();
    assertThat(autoConfigCalls[0][3]).isEqualTo('123456789');

    const pushStateCalls = setInWindowCalls.filter((c) => c[0] === 'fbq.disablePushState');
    assertThat(pushStateCalls.length).isEqualTo(1);
    assertThat(pushStateCalls[0][1]).isTrue();

    assertApi('gtmOnSuccess').wasCalled();
    assertApi('gtmOnFailure').wasNotCalled();
- name: '[DataLayer Push] Pushes event with custom and default settings'
  code: |-
    [
      {
        desc: 'custom name and layer',
        dataLayerEventName: 'fb_pageview',
        dataLayerVariableName: 'myDataLayer',
        eventId: 'evt-123',
        expectedLayer: 'myDataLayer',
        expectedEvent: 'fb_pageview'
      },
      {
        desc: 'defaults when not specified',
        dataLayerEventName: undefined,
        dataLayerVariableName: undefined,
        eventId: 'evt-456',
        expectedLayer: 'dataLayer',
        expectedEvent: 'DefaultTagEvent'
      }
    ].forEach((scenario) => {
      createQueueItems = [];
      const testData = assign(assign({}, mockData), {
        dataLayerEventPush: true,
        dataLayerEventName: scenario.dataLayerEventName,
        dataLayerVariableName: scenario.dataLayerVariableName,
        eventId: scenario.eventId
      });

      runCode(testData);

      const dlPushes = createQueueItems.filter((c) => c[0] === scenario.expectedLayer);
      assertThat(dlPushes.length).isEqualTo(1);
      assertThat(dlPushes[0][1].event).isEqualTo(scenario.expectedEvent);
      assertThat(dlPushes[0][1].eventId).isEqualTo(scenario.eventId);

      assertApi('gtmOnSuccess').wasCalled();
      assertApi('gtmOnFailure').wasNotCalled();
    });
- name: '[Scripts] Param builder calls processAndCollectAllParams when available'
  code: |-
    mock('copyFromWindow', (key) => {
      if (key === 'fbq') return mockFbq;
      if (key === 'clientParamBuilder.processAndCollectAllParams') return function() {};
      return undefined;
    });

    runCode(mockData);

    assertThat(injectScriptCalls.length).isEqualTo(2);
    assertApi('callInWindow').wasCalledWith('clientParamBuilder.processAndCollectAllParams');
    assertApi('gtmOnSuccess').wasCalled();
    assertApi('gtmOnFailure').wasNotCalled();
- name: '[Scripts] Param builder disabled injects only fbevents and removes -pb suffix'
  code: |-
    const testData = assign(assign({}, mockData), { enableParamBuilderSdk: false });

    runCode(testData);

    assertThat(injectScriptCalls.length).isEqualTo(1);
    assertThat(injectScriptCalls[0].url).isEqualTo('https://connect.facebook.net/en_US/fbevents.js');

    const agentCalls = fbqCalls.filter((c) => c[0] === 'set' && c[1] === 'agent');
    assertThat(agentCalls[0][2]).isEqualTo(PARTNER_AGENT_VERSION);

    assertApi('gtmOnSuccess').wasCalled();
    assertApi('gtmOnFailure').wasNotCalled();
- name: '[Scripts] Param builder not injected again when already loaded or loading'
  code: |2-
       ['loading', 'loaded'].forEach((status) => {
          injectScriptCalls = [];

          mock('copyFromWindow', (key) => {
            if (key === 'fbq') return mockFbq;
            if (key === '_meta_param_builder_sdk_status') return status;
            return undefined;
          });

          runCode(mockData);

          assertThat(injectScriptCalls.length).isEqualTo(1);
          assertThat(injectScriptCalls[0].url).isEqualTo('https://connect.facebook.net/en_US/fbevents.js');

          assertApi('gtmOnSuccess').wasCalled();
          assertApi('gtmOnFailure').wasNotCalled();
        });
- name: '[Scripts] Param builder not injected on Magento 2 Checkout'
  code: |2-
       const checkoutConfig = {};
        checkoutConfig.quoteData = {};
        checkoutConfig.defaultSuccessPageUrl = '/checkout/success';
        checkoutConfig.storeCode = 'default';

        mock('copyFromWindow', (key) => {
          if (key === 'fbq') return mockFbq;
          if (key === 'checkoutConfig') return checkoutConfig;
          return undefined;
        });

        runCode(mockData);

        assertThat(injectScriptCalls.length).isEqualTo(1);
        assertThat(injectScriptCalls[0].url).isEqualTo('https://connect.facebook.net/en_US/fbevents.js');

        assertApi('gtmOnSuccess').wasCalled();
        assertApi('gtmOnFailure').wasNotCalled();
- name: '[Scripts] fbevents failure calls gtmOnFailure'
  code: |-
    mock('injectScript', (url, onsuccess, onfailure) => {
      if (url === 'https://connect.facebook.net/en_US/fbevents.js') {
        onfailure();
      }
    });

    runCode(mockData);

    assertApi('gtmOnSuccess').wasNotCalled();
    assertApi('gtmOnFailure').wasCalled();
- name: '[Event Enhancement] Reads stored data from localStorage and writes back'
  code: |-
    localStorageData.gtmeec = '{"em":"stored@example.com"}';

    const testData = assign(assign({}, mockData), {
      enableEdvancedMatching: true,
      enableEventEnhancement: true,
      userDataFromVariable: { ph: '1999999999' }
    });

    runCode(testData);

    const initCalls = fbqCalls.filter((c) => c[0] === 'init');
    const userData = initCalls[0][2];
    assertThat(userData.em).isEqualTo('stored@example.com');
    assertThat(userData.ph).isEqualTo('1999999999');

    assertThat(localStorageData.gtmeec).isDefined();
    const stored = JSON.parse(localStorageData.gtmeec);
    assertThat(stored.em).isEqualTo('stored@example.com');
    assertThat(stored.ph).isEqualTo('1999999999');

    assertApi('gtmOnSuccess').wasCalled();
    assertApi('gtmOnFailure').wasNotCalled();
- name: '[Event Enhancement] Skips localStorage read and write when consent is revoked'
  code: |-
    let getItemCalled = false;
    let setItemCalled = false;
    mockObject('localStorage', {
      getItem: (key) => { getItemCalled = true; return localStorageData[key]; },
      setItem: (key, value) => { setItemCalled = true; localStorageData[key] = value; }
    });

    localStorageData.gtmeec = '{"em":"stored@example.com"}';

    const testData = assign(assign({}, mockData), {
      consent: false,
      enableEdvancedMatching: true,
      enableEventEnhancement: true,
      userDataFromVariable: { ph: '1999999999' }
    });

    runCode(testData);

    assertThat(getItemCalled).isFalse();
    assertThat(setItemCalled).isFalse();

    const initCalls = fbqCalls.filter((c) => c[0] === 'init');
    const userData = initCalls[0][2];
    assertThat(userData.em).isUndefined();
    assertThat(userData.ph).isEqualTo('1999999999');

    assertApi('gtmOnSuccess').wasCalled();
    assertApi('gtmOnFailure').wasNotCalled();
- name: '[Event Enhancement] Hashed storage calls hashUserDataFields with sync hash'
  code: |-
    mock('copyFromWindow', (key) => {
      if (key === 'fbq') return mockFbq;
      if (key === 'dataTag256') return function() { return 'abc123hash'; };
      return undefined;
    });

    mock('callInWindow', (key) => {
      if (key === 'dataTag256') return 'abc123hash';
      return undefined;
    });


    const testData = assign(assign({}, mockData), {
      enableEdvancedMatching: true,
      enableEventEnhancement: true,
      storeUserDataHashed: true,
      userDataFromVariable: { email: 'test@example.com' }
    });

    runCode(testData);

    assertThat(localStorageData.gtmeec).isDefined();
    const stored = JSON.parse(localStorageData.gtmeec);
    assertThat(stored.em).isEqualTo('abc123hash');

    assertApi('callInWindow').wasCalledWith('dataTag256', 'test@example.com', 'HEX');
    assertApi('gtmOnSuccess').wasCalled();
    assertApi('gtmOnFailure').wasNotCalled();
- name: '[Event Enhancement] Hashed storage with async sha256 stores hashed data'
  code: |-
    mock('sha256', (input, successCb, errorCb, options) => {
      successCb('async_hashed_' + input);
    });

    mock('copyFromWindow', (key) => {
      if (key === 'fbq') return mockFbq;
      return undefined;
    });

    const testData = assign(assign({}, mockData), {
      enableEdvancedMatching: true,
      enableEventEnhancement: true,
      storeUserDataHashed: true,
      userDataFromVariable: { email: 'test@example.com' }
    });

    runCode(testData);

    assertThat(localStorageData.gtmeec).isDefined();
    const stored = JSON.parse(localStorageData.gtmeec);
    assertThat(stored.em).isEqualTo('async_hashed_test@example.com');

    assertApi('gtmOnSuccess').wasCalled();
    assertApi('gtmOnFailure').wasNotCalled();
- name: '[Event ID] Passes eventID option in track call'
  code: |-
    mockData.eventId = 'evt-abc-123';

    runCode(mockData);

    const trackCalls = fbqCalls.filter((c) => c[0] === 'trackSingle');
    assertThat(trackCalls.length).isEqualTo(1);
    assertThat(trackCalls[0][4]).isEqualTo({ eventID: 'evt-abc-123' });

    assertApi('gtmOnSuccess').wasCalled();
    assertApi('gtmOnFailure').wasNotCalled();
- name: '[Advanced Matching] Re-inits initialized pixel when runInitOnce is false'
  code: |-
    const testData = assign(assign({}, mockData), {
      enableEdvancedMatching: true,
      runInitOnce: false,
      userDataFromVariable: { email: 'test@example.com' }
    });

    mock('copyFromWindow', (key) => {
      if (key === 'fbq') return mockFbq;
      if (key === '_meta_gtm_ids') return ['123456789'];
      return undefined;
    });

    runCode(testData);

    const initCalls = fbqCalls.filter((c) => c[0] === 'init');
    assertThat(initCalls.length).isEqualTo(1);
    assertThat(initCalls[0][2].em).isEqualTo('test@example.com');

    assertApi('gtmOnSuccess').wasCalled();
    assertApi('gtmOnFailure').wasNotCalled();
- name: '[DL Version] enableCurrentDataLayerOnly uses DL version 1'
  code: |-
    let capturedVersion;
    mock('copyFromDataLayer', (key, version) => {
      if (key === 'search_term') {
        capturedVersion = version;
        return 'test query';
      }
      return undefined;
    });

    const testData = assign(assign({}, mockData), {
      enableDataLayerMapping: true,
      enableCurrentDataLayerOnly: true,
      eventNameStandard: 'Search'
    });

    runCode(testData);

    assertThat(capturedVersion).isEqualTo(1);

    assertApi('gtmOnSuccess').wasCalled();
    assertApi('gtmOnFailure').wasNotCalled();
setup: |-
  const JSON = require('JSON');
  const Object = require('Object');

  const PARTNER_AGENT_VERSION = 'stape-gtm-1.2.0';

  const assign = (target, source) => {
    if (!source) return target;
    Object.keys(source).forEach((key) => { target[key] = source[key]; });
    return target;
  };

  let fbqCalls = [];
  const mockFbq = function() {
    const args = [];
    for (let i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    fbqCalls.push(args);
  };
  mockFbq.queue = [];

  let setInWindowCalls = [];
  mock('setInWindow', (key, value, override) => {
    setInWindowCalls.push([key, value, override]);
  });

  let injectScriptCalls = [];
  mock('injectScript', (url, onsuccess, onfailure, cacheToken) => {
    injectScriptCalls.push({ url: url, onsuccess: onsuccess, onfailure: onfailure, cacheToken: cacheToken });
    onsuccess();
  });

  mock('copyFromWindow', (key) => {
    if (key === 'fbq') return mockFbq;
    return undefined;
  });

  mock('aliasInWindow', () => true);

  let createQueueItems = [];
  mock('createQueue', (name) => {
    return (item) => { createQueueItems.push([name, item]); };
  });

  mock('copyFromDataLayer', () => undefined);
  mock('isConsentGranted', () => true);
  mock('addConsentListener', () => {});

  let templateStorageData = {};
  mockObject('templateStorage', {
    getItem: (key) => templateStorageData[key],
    setItem: (key, value) => { templateStorageData[key] = value; }
  });

  let localStorageData = {};
  mockObject('localStorage', {
    getItem: (key) => localStorageData[key],
    setItem: (key, value) => { localStorageData[key] = value; }
  });

  const mockData = {
    pixelIds: '123456789',
    consent: true,
    enableConsentMode: false,
    inheritEventName: 'override',
    eventName: 'standard',
    eventNameStandard: 'PageView',
    enableDataLayerMapping: false,
    enableEdvancedMatching: false,
    enableParamBuilderSdk: true,
    dpoLDU: false,
    disableAutoConfig: false,
    disablePushState: false,
    dataLayerEventPush: false,
    enableEventEnhancement: false,
    storeUserDataHashed: false,
    runInitOnce: false,
    enableCurrentDataLayerOnly: false
  };


___NOTES___

2026-08-26 - Change Notes:
  - Fork of "Facebook Pixel by Stape" (Apache-2.0, https://github.com/stape-io): collector-only.
    Sends a faithful copy of each browser event (same event_id) to a Meta Deduplication Monitor
    collector (/c/browser) via sendPixel; it never calls fbq and never loads fbevents.js.
    Pair it with your real Meta tag on the same trigger so both share the same event_id variable.
  - With an empty Collector URL the tag is a no-op.
  - Consent-gated: sends only after ad_storage is granted (or with manual consent enabled).
  - See NOTICE and QA-CHECKLIST.md in this directory.

2026-06-09 - Change Notes:
  - Forced casting to string before normalization when storing User Data in hashed format.
  - Improved legibility of user data presence checking from multiple sources.
  - Code formatting.

2026-05-13 - Change Notes:
  - Prevent Param Builder SDK from being re-injected when it is already loading or has loaded, using a window-level status flag (_meta_param_builder_sdk_status)
  - Skip Param Builder SDK injection on Magento 2 checkout pages to avoid compatibility conflicts

2026-04-09 - Change Notes:
  - Add optional Meta Parameter Builder SDK integration (enabled by default) to improve _fbp and _fbc cookie coverage, including backup Click ID retrieval from in-app browsers
  - Add consent-aware event enhancement: user data is now only read from/written to localStorage when consent is granted
  - Bump version to stape-gtm-1.2.0 (with -pb suffix when Param Builder SDK is active)

Created on 08/15/2025, 08:58:45 AM


