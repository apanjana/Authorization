function authorize() {
  var oauth2Service = getOAuth2Service();
  if (!oauth2Service.hasAccess()) {
    var authorizationUrl = oauth2Service.getAuthorizationUrl();
    Logger.log('Authorization URL: ' + authorizationUrl);
    var template = HtmlService.createTemplate(
      '<a href="<?= authorizationUrl ?>" target="_blank">Authorize</a>. ' +
      'Reopen the web app when the authorization is complete.');
    template.authorizationUrl = authorizationUrl;
    return template.evaluate();
  } else {
    var identifier = "917709496070";
    var password = "entrib";
    var sessionId = getSessionId(identifier, password);
    Logger.log('Access token: ' + oauth2Service.getAccessToken());
    Logger.log("Session ID: " + sessionId);
  }
}

function getOAuth2Service() {
  var scriptProperties = PropertiesService.getScriptProperties();
  var clientId = scriptProperties.getProperty('497718602300-njg98bhh7lvrbtu8prauh2ir1u730c5u.apps.googleusercontent.com');
  var clientSecret = scriptProperties.getProperty('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');
  var redirectUri = scriptProperties.getProperty('http://qa.shopworx.io/server/authenticate');

  return OAuth2.createService('MyOAuth2Service')
    .setAuthorizationBaseUrl('https://accounts.google.com/o/oauth2/auth')
    .setTokenUrl('https://accounts.google.com/o/oauth2/token')
    .setClientId('497718602300-njg98bhh7lvrbtu8prauh2ir1u730c5u.apps.googleusercontent.com')
    .setClientSecret('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')
    .setCallbackFunction('authCallback')
    .setPropertyStore(PropertiesService.getUserProperties())
    .setScope('https://www.googleapis.com/auth/drive');
}

function authCallback(request) {
  var oauth2Service = getOAuth2Service();
  var isAuthorized = oauth2Service.handleCallback(request);
  if (isAuthorized) {
    return HtmlService.createHtmlOutput('Authorization successful. You can close this tab.');
  } else {
    return HtmlService.createHtmlOutput('Authorization failed.');
  }
}
function getConfig(request) {
  var config = {
    configParams: [
      {
        name: "sessionId",
        type: "STRING",
        label: "Session ID",
        placeholder: "Enter the session ID",
      },
      {
        name: "access token",
        type: "STRING",
        label: "Access Token",
        placeholder: "Enter the Access Token",
      },
    ],
  };
  return config;
}

// This array describes the schema of the data that the data source will return.
var Schema = [
    {
    name: "id",
    label: "ID",
    dataType: "NUMBER",
    semantics: {
      conceptType: "DIMENSION",
    },
  },
  {
    name: "firstname",
    label: "First Name",
    dataType: "STRING",
    semantics: {
      conceptType: "DIMENSION",
    },
  },
    {
    name: "lastname",
    label: "Last Name",
    dataType: "STRING",
    semantics: {
      conceptType: "DIMENSION",
    },
  },
  {
    name: "phoneNumber",
    label: "Phone Number",
    dataType: "NUMBER",
    semantics: {
      conceptType: "DIMENSION",
    },
  },
  {
    name: "roleName",
    label: "Role Name",
    dataType: "STRING",
    semantics: {
      conceptType: "DIMENSION",
    },
  },
  {
    name: "industryName",
    label: "Industry Name",
    dataType: "STRING",
    semantics: {
      conceptType: "DIMENSION",
    },
  },
];

// This function returns the schema object defined in Schema.
function getSchema(request) {
  return { schema: Schema };
}

function getSessionId() {
  // ShopWorx server URL
  var baseUrl = "http://qa.shopworx.io/server/authenticate/";

  // Authentication payload
  var payload = {
    "identifier": "917709496070",
    "password": "entrib"
  };

  // Set authentication headers
  var headers = {
    "Content-Type": "application/json",
    "loginType": "INFINITY"
  };

  // Authenticate and get session ID
  var authResponse = UrlFetchApp.fetch(baseUrl, {
    method: "POST",
    headers: headers,
    payload: JSON.stringify(payload)
  });

  var authData = JSON.parse(authResponse.getContentText());
  var sessionId = authData.sessionId;
  return sessionId;
}

// The getData function retrieves data from the Shopworx API "http://qa.shopworx.io/server/users/mydetails/" and returns it in a format that can be used by Looker Studio.
function getData(request) {
  var baseUrl = "http://qa.shopworx.io/server/users/mydetails/";
  var sessionId = request.configParams.sessionId;
  var headers = {
    "sessionId": sessionId
  };
  
  var response = UrlFetchApp.fetch(baseUrl, {
    headers: headers
  });
  var json = response.getContentText();
  var data = JSON.parse(json);

  var dataSchema = [];
  request.fields.forEach(function (field) {
    for (var i = 0; i < Schema.length; i++) {
      if (Schema[i].name === field.name) {
        dataSchema.push(Schema[i]);
        break;
      }
    }
  });

  var row = [];
  request.fields.forEach(function (field) {
    switch (field.name) {
      case "id":
        row.push(data.results.user.id);
        break;      
      case "firstname":
        row.push(data.results.user.firstname);
        break;
      case "lastname":
        row.push(data.results.user.lastname);
        break;
      case "phoneNumber":
        row.push(data.results.user.phoneNumber);
        break;
      case "roleName":
        row.push(data.results.role.roleName);
        break;
      case "industryName":
        row.push(data.results.industry.industryName);
        break;  
      default:
        row.push("");
    }
  });

  return {
    schema: dataSchema,
    rows: [{ values: row }],
  };
}

// This function returns an object that specifies the authentication type for the data source.
function getAuthType() {
  var response = {
    type: "NONE",
  };
  return response;
}