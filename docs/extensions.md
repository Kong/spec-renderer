# Spec renderer Extensions

## x-kong-client-credentials-config

Allows to specify additional request parameters (body) rro be send to auth2 token endpoint when using client credentials flow.

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
            defaultValue: https://api.vitu.com/v1

      flows:
        clientCredentials:
          tokenUrl: https://example.com/oauth2/token
```

`extraTokenRequestParameters` - array of additional request parameters to be sent to token endpoint.
each parameter can have the following fields:
- `name` (string, required) - name of the parameter
- `label` (string, optional) - label of the parameter
- `description` (string, optional) - description of the parameter
- `defaultValue` (string, optional) - default value of the parameter
- `omitIfEmpty` (boolean, optional) - if true, the parameter will be omitted if the value is empty
- `required` (boolean, optional) - if true, the parameter is required
- `readonly` (boolean, optional) - if true, the parameter
- `hidden` (boolean, optional) - if true, the parameter will be hidden from the UI but send to the token endpoint

