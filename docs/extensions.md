# Spec renderer Extensions

## x-kong-client-credentials-config

Allows to specify additional request parameters (body) to be send to auth2 token endpoint when using client credentials flow.

![](./images/XKongClientCredentialsConfig.png)


example:
```yaml
components:
  securitySchemes:
    OAuth2ClientCredentials:
      type: oauth2
      # extension
      x-kong-client-credentials-config:
        extraTokenRequestParameters:
          - name: organization
            label: Organization
            description: The organization identifier
            omitIfEmpty: true
          - name: audience
            label: Audience
            required: true
            value: https://api.audience.com/v1

      flows:
        clientCredentials:
          tokenUrl: https://example.com/oauth2/token
```

`extraTokenRequestParameters` - array of additional request parameters to be sent to token endpoint.

each parameter can have the following properties:

| Property | Description | Default |
|----------|-------------|---------|
| `name` | Name of the parameter | Required |
| `label` | Label of the parameter, if not provided, `name` will be used | `name` value |
| `description` | Description of the parameter, shown as tooltip | `''` |
| `value` | Default value of the parameter | `''` |
| `omitIfEmpty` | If true, the parameter will be omitted in the request if the value is empty | `false` |
| `required` | If true, the parameter is required | `false` |
| `readOnly` | If true, the user cannot edit value of the parameter | `false` |
| `hidden` | If true, the parameter will be hidden from the UI but sent to the token endpoint | `false` |

---

## x-sensitive-data

Marks a schema property as sensitive so its value is masked in displayed examples and API responses.
The actual value is **never sent** — masking is display-only.

### Mask strategies

| Strategy | Result | Use when |
|----------|--------|----------|
| `full` | `••••••` | Hide the value entirely |
| `remove` | *(field omitted)* | Remove the field from the example |
| `hash` | `3d2a1f8c` | Show that two values are equal without revealing either |
| `regex` | partial mask (e.g. `••••••@example.com`) | Mask only part of the value |

### Usage

Add `x-sensitive-data` to any schema property:

```yaml
components:
  schemas:
    LoginRequest:
      type: object
      properties:
        username:
          type: string
          example: alice
        password:
          type: string
          x-sensitive-data:
            mask: full        # displayed as ••••••
        email:
          type: string
          x-sensitive-data:
            mask: regex
            pattern: ^[^@]+  # displayed as ••••••@example.com
        apiToken:
          type: string
          x-sensitive-data:
            mask: remove      # field omitted from example entirely
```

### Where masking is applied

| Surface | What is masked |
|---------|----------------|
| Request body example (code samples) | Properties with `x-sensitive-data` |
| Response body example (code samples) | Properties with `x-sensitive-data` |
| TryIt request body | Properties with `x-sensitive-data` — shown as read-only masked view; click **Unmask** to edit |
| TryIt response body | Properties with `x-sensitive-data` |
| TryIt response headers | Auth headers from `securitySchemes` (automatic, no annotation needed) |
| Code sample auth headers/query | Auth values from `securitySchemes` (automatic) |

> **Note:** TryIt API calls always send the **real** credential values. Masking only affects what is displayed on screen.

### Toggle

Each panel that contains masked data shows a **"Mask sensitive data"** toggle (on by default). Turn it off to reveal the real values inline without leaving the page. The toggle is hidden when no masking is active for that panel.

### How it works

```mermaid
flowchart TD
    spec[OpenAPI Spec]

    spec -->|securitySchemes| rules[buildSecuritySchemeMaskRules produces placeholder rules using ••••••]
    spec -->|x-sensitive-data on properties| crawl[crawl / getSampleBody generates body example]

    rules -->|masked auth headers & query| RS[Code Sample display]
    rules -->|real auth headers & query| TI[TryIt API call sends real credentials]

    crawl -->|applyMask per property| RS
    crawl -->|applyMask per property| RespS[Response Sample display]

    TI -->|actual HTTP response| mask[maskBodyExample findResponseSchema]
    mask -->|masked body| TR[TryIt Response display]

    rules -->|maskAuthHeaders| TR
```

**Step by step:**

1. **Code samples** — When the renderer generates a code snippet, `buildSecuritySchemeMaskRules` reads the operation's `securitySchemes` and replaces real auth header/query values with `••••••`.

2. **Body examples** — `crawl()` walks the schema to build an example object. For each property with `x-sensitive-data`, it calls `applyMask` before adding the value to the example. This covers both request and response body samples shown in code snippets.

3. **TryIt request** — The real credential values are always sent so the API call works correctly. Masking does not affect the actual HTTP request.

4. **TryIt response body** — After receiving a response, `findResponseSchema` looks up the matching response schema (exact status code → wildcard e.g. `4XX` → `default`). `maskBodyExample` then recursively walks the parsed response JSON and masks any property marked with `x-sensitive-data`.

5. **TryIt response headers** — Response headers are checked against the security scheme mask rules. Any header name matching a rule (e.g. `Authorization`) is replaced with its placeholder before display.

