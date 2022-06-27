# Schemas

Al-Kun introduces a universal schema for our APIs and internals. It is loosely based on OpenAPI. We prefer to keep the specification simple and will frozen it after we received enough feedbacks.

## Specification

There will always be only 1 version. The plan is so the knowledge (Bayan source) we accumulated long lasting.

### Format
Al-Kun Schema itself a JSON Documents. No, we won't add more format in the future. We use **camelCase** naming convention for keys, but flexible on the values.

### Data Types
Below are supported data types, case-sensitive:
1. string
2. integer
3. decimal
4. boolean
5. array
6. object

Optionally we also support **format** attribute for **string** type, below are pre-defined ones:
1. base64 - Base64 encoding
2. date - in ISO 8601 format
3. time
4. dateTime
5. uri
6. email

Format is open value, not restricted to above.

### Sample
```
{
    "mystr": {
        "type": "string",
        "description": "...",
        "format": "date"
    },
    "myobj": {
        "type": "object",
        "properties": {             # without properties, object is free-form
            "propA": { "type": "string" },
            "propB": { "type": "string" },
            "propC": { "type": "integer" }   
        }
    },
    "myarray": {
        "type": "array",
        "items": {
            "type: "string",
        }
    },
    "myenum": {                     # example of fixed selection
        "type": "array",
        "items": {
            "type: "string",
            "enum": ["fajr", "dhuha", ...]
        }
    },
    "myref": {                      # example using ref to reuse schema
        "ref": "myobj/propA",       # use same schema as myobj.propA
    },
    "myflex": {                     # flexible type example
        "type": "object",
        "properties": {
            "*": {                  # dynamic property name
                "anyOf": {          # can be any of these types
                    { "type": "string" },
                    { "type": "integer" },
                    { "type": "bool" }
                },
                "anyValue": {}      # shorthand for anyOf with all types
            }
        }
    },

    "required": [ "mystr", "myobj" ]   # define on any levels
}
```

