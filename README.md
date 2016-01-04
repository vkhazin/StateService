# NoLdapState Service #

State management for the purpose of Authentication, Authorization, and arbitrary session data storage.

Sliding expiry: sessionExpirySec setting in ./config/default.json file.
Get/Put/Patch will extend the sliding expiry.

Two repository types supported: redis and couchbase. 

## Create Session ##
Secured by x-key Http Header.

Initial implementation compares credentials.key from ./config/default.json file

### Request ###
Header ->  
x-key: string  
x-ttl: integer in seconds to contorl session expiry.

POST: /

BODY:

```
{
    "xSessionToken": "Wl5DA4rBbDNcuYpuJxwQ8xrLC98LPKaS7wcjm9", <--Optional when consumer wants to dictate session token
    "AccountId": "6309c3e7-4637-4a7d-b20e-c0cf3f628d0f"
}
```

### Response ###
Status: 200

BODY:

```
{
    "AccountId": "6309c3e7-4637-4a7d-b20e-c0cf3f628d0f",
    "xSessionToken": "1c6d3006-9ca4-4115-80ee-9fc9225f3001",
    "Expires": "2015-05-18T17:15:51.628Z",
    "Ttl":86400
}
```

If an "xSessionToken" value has been supplied in the request - the service will honour the value instead of issuing a new one.

## Get Session ##
Secured by x-session-token Http Header.

Returns full content of the session.

### Request ###
Header -> x-session-token: Id from the create session response

GET: /

### Response-OK ###
Status: 200

BODY:

```
{
    "AccountId": "6309c3e7-4637-4a7d-b20e-c0cf3f628d0f",
    "xSessionToken": "02a3e5bb-607c-4f68-a6c6-f2ecd024c9ed",
    "Expires": "2015-05-18T17:18:25.813Z",
    "Ttl":86400
}
```

### Response-Error ###
Status: 401

BODY:

```
{
    "code": "UnauthorizedError",
    "message": "Session with token:'12a3e5bb-607c-4f68-a6c6-f2ecd024c9ed' was not found"
}
```

## Validate Session ##
Secured by x-session-token Http Header.

Returns confirmation session is alive. 


### Request ###
Header -> x-session-token: Id from 'create session' response

GET: /validate

### Response-OK ###
Status: 200

BODY:

```
{
    "IsValid": true,
    "Expires": "2015-05-18T17:21:13.127Z",
    "Ttl":86400
}
```

### Response-Error ###
Status: 401

BODY:

```
{
    "code": "UnauthorizedError",
    "message": "Session with token:'143b1a04-a816-4cdf-958f-15ab56350479' was not found"
}
```

## Update/Replace Session ##
Secured by x-session-token Http Header.

Replaces content of session with request body.

### Request ###
Header -> x-session-token: string

PUT: /

BODY:

```
{
    "AccountId":"6309c3e7-4637-4a7d-b20e-c0cf3f628d0f"
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
    "Ttl":86400
}
```

### Response-Error ###
Status: 401
BODY:

```
{
    "code": "UnauthorizedError",
    "message": "Session with token:'143b1a04-a816-4cdf-958f-15ab56350479' was not found"
}
```

## Update/Patch Session ##
Secured by x-session-token Http Header.

Adds to the content of session based on request body.

### Request ###
Header -> x-session-token: string

PATCH: /

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
    "code": "UnauthorizedError",
    "message": "Session with token:'143b1a04-a816-4cdf-958f-15ab56350479' was not found"
}
```

## Delete Session ##
Secured by x-session-token Http Header.

Terminates the session.

### Request ###
Header -> x-session-token: string

DELETE: /

### Response-OK ###
Status: 200

BODY:

```
{
    "Deleted": true
}
```
### Response-Error ###
Status: 404

BODY:

```
{
    "Deleted": false
}
```
