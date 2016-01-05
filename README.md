# State Service #

State management for the purpose of arbitrary session data storage.

Sliding expiry: defaultTtlSec setting in ./config/default.json file.
Get/Put/Patch will extend the sliding expiry.

# Create Session #
Secured by x-auth-key Http Header.

Initial implementation compares xAuthKeys from ./config/default.json file

## Request ##
Header ->  
x-auth-key: string  

POST: /v1

BODY:

```
{
    "xSessionToken": "Wl5DA4rBbDNcuYpuJxwQ8xrLC98LPKaS7wcjm9", <--Optional when consumer wants to dictate session token
    "AccountId": "6309c3e7-4637-4a7d-b20e-c0cf3f628d0f",
    "ttlSec": 36000 <--Optional, if omitted default value is used
}
```

## Response ##
Status: 200

BODY:

```
{
    "AccountId": "6309c3e7-4637-4a7d-b20e-c0cf3f628d0f",
    "xSessionToken": "1c6d3006-9ca4-4115-80ee-9fc9225f3001",
    "expiresOn": "2015-05-18T17:15:51.628Z",
    "ttlSec": 3600
}
```

# Get Session #
Secured by x-session-token Http Header.
Returns full content of the session.

## Request ##
Header -> x-session-token: Id from the create session response

GET: /v1/1c6d3006-9ca4-4115-80ee-9fc9225f3001

### Response-OK ###
Status: 200

BODY:

```
{
    "AccountId": "6309c3e7-4637-4a7d-b20e-c0cf3f628d0f",
    "xSessionToken": "1c6d3006-9ca4-4115-80ee-9fc9225f3001",
    "expiresOn": "2015-05-18T17:15:51.628Z",
    "ttlSec": 3600
}
```

## Response-Error ##
Status: 401

BODY:

```
{
    "code": "401",
    "message": "Invalid xSessionToken: 12a3e5bb-607c-4f68-a6c6-f2ecd024c9ed"
}
```

# Validate Session #

Returns confirmation session is alive. 

### Request ###

GET: /v1/6309c3e7-4637-4a7d-b20e-c0cf3f628d0f/validate

## Response-OK ##
Status: 200

BODY:

```
{
    "isValid": true,
    "expiresOn": "2015-05-18T17:21:13.127Z",
    "ttlSec":86400
}
```

## Response-Error ##
Status: 401

BODY:

```
{
    "code": "401",
    "message": "Invalid xSessionToken: 12a3e5bb-607c-4f68-a6c6-f2ecd024c9ed"
}
```

## Update/Replace Session ##

Replaces content of session with the request body.

## Request ##

PUT: /v1/6309c3e7-4637-4a7d-b20e-c0cf3f628d0f

BODY:

```
{
    "NewValue":"6309c3e7-4637-4a7d-b20e-c0cf3f628d0f"
}
```

## Response-OK ##
Status: 200

BODY:

```
{
    "AccountId": "6309c3e7-4637-4a7d-b20e-c0cf3f628d0f",
    "xSessionToken": "1c6d3006-9ca4-4115-80ee-9fc9225f3001",
    "Expires": "2015-05-18T17:15:51.628Z",
    "Ttl": 3600,
    "NewValue":"6309c3e7-4637-4a7d-b20e-c0cf3f628d0f"
}
```

## Response-Error ##
Status: 401
BODY:

```
{
    "code": "401",
    "message": "Invalid xSessionToken: 12a3e5bb-607c-4f68-a6c6-f2ecd024c9ed"
}
```

# Update/Patch Session #

Adds to the content of session based on request body.

## Request ##

PATCH: /v1/6309c3e7-4637-4a7d-b20e-c0cf3f628d0f

BODY:

```
{
    "NewField":"dummy"
}
```

### Response-OK ###
Status: 200

BODY:

```
{
    "AccountId": "6309c3e7-4637-4a7d-b20e-c0cf3f628d0f",
    "xSessionToken": "1c6d3006-9ca4-4115-80ee-9fc9225f3001",
    "Expires": "2015-05-18T17:15:51.628Z",
    "Ttl":86400,
    "NewField":"dummy"
}
```
### Response-Error ###
Status: 401

BODY:

```
{
    "code": "401",
    "message": "Invalid xSessionToken: 12a3e5bb-607c-4f68-a6c6-f2ecd024c9ed"
}
```

## Delete Session ##

Terminates the session.

## Request ##

DELETE: /v1/6309c3e7-4637-4a7d-b20e-c0cf3f628d0f

## Response-OK ##
Status: 200

BODY:

```
{
    "deleted": true
}
```
## Response-Error ##
Status: 404

BODY:

```
{
    "deleted": false
}
```

# Environments #

Dev: http://state-service-dev-ms.end-points.io/
