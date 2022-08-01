# Al-Bayan

Al-Kun introduced a universal Schema specification and Vocabulary called Al-Bayan for our APIs and internals. It is based upon JSON-LD and Schema.org. We prefer to keep the specification simple and consize. Average developer need just few a minutes to grasp the concept.


### Document Type
Bayan documents is a JSON documents. For optimization and compression, we also use CBOR serialization format.


### Naming Convention
Bayan is case-sensitive. Use **TitleCase** for type (class) and **camelCase** for property and everything else.


### Schema Specification

Bayan specification is frozen and will not evolve, only vocabulary will. The plan is so the knowledge (Bayan source) we accumulated long lasting.
Below is the complete specification:

List of Keywords:

**@namespace** - Use namespace to import the vocabularies required \
**@define** - implement our own class/type \
**@type** - A class/type to describe our data \
**@extend** - Allows declaration of hierarchies of classes, similar to rdfs:subclassOf \
**@comment** - Use this to describe the type or property \
**@enum** - Enumeration allow you to set a list of allowed values \
**@default** - Default value for a property \
**@required** - a set of required properties for the schema \
**@base** - Base URL for the document, default to document origin \
**@example** - Use to showcase example usage of the schema definition

Example:
```
{
    @namespace : "https://schema.alkun.org",

    @define : {
        @type : "Imam",
        @extend : "Person",
        @comment : "Leader in muslim prayer",

        mosque: {
            @type : "Place"
        },

        @required : [ givenName, mosque, url ],

        @example : {
            @type : "Imam",
            givenName : "Abdul",
            mosque : {
                name : "al-Masjid al-Nabawi"
            },
            url : "/masjid-nabawi"
        }
    }
}
```

We can import multiple vocabularies using namespace as below:
```
@namespace : {
    default : "https://schema.alkun.org",
    xsd: "http://www.w3.org/2001/XMLSchema#",
    foaf : "http://xmlns.com/foaf/0.1/"
}
```

And use it like this:
```
foaf:page : "http://www.example.com/roadster"
```

### Additional Syntax
1. All property can have a single or multiple values, it is up to server to process the values.
2. **@type** can also be more than one (eg: @type: ["Text", "URL"])


### Vocabulary

We use Bayan to build our own vocabulary which has good compatibility with Schema.org.


#### Data Types

Below are basic data types defined inside [DataType.json](https://alkun.org/schema/DataType.json)

**Text** - A sequence of UTF-8 characters \
**Number** - Can be an integer or decimal \
**Boolean** - Boolean data type, value is [true, false] \
**Binary** - A raw bytes sequence, use in CBOR \
**Date** - A date value in ISO 8601 format \
**Time** - A time value in form of hh:mm:ss[Z|(+|-)hh:mm] \
**DateTime** - A combination of date and time in ISO 8601 format \
**URL** - A Uniform Resource Locator or web address


*Notes: Previously the specification was based on Open-API. We decided to move to semantic web format instead to allow a meaningful API etc.*