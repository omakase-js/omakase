# @artsy/omakase – CLI

The CLI package offers command-line based workflow tools that we have settled on at Artsy.

## React Component & Relay Container Generator

This generator will create a component module and accompanying test file, and optionally a Relay container based on the
GraphQL type and field specified to one of the options.

_Note that currently the test setup is an entirely custom setup that [we have at Artsy][renderrelaytree], which may
change now that we’re starting to migrate to Relay v4–which has some convenient test helpers. If you have experience
with that setup and are feeling generous, please send a PR for an updated generator our way!_

```
$ yarn om g --help
Template for your React/Relay component

USAGE
  $ om generate COMPONENT

OPTIONS
  -c, --classBased                             create a class based component, instead of the default
                                               function

  -f, --fragmentContainer=GraphQLType          name of the type on which to create a fragment

  -h, --help                                   show CLI help

  -p, --paginationContainer=GraphQLType.field  name of the type on which to create a fragment and the
                                               field to paginate

  -r, --refetchContainer=GraphQLType           name of the type on which to create a fragment

ALIASES
  $ om g
```

### Examples

#### Plain React Component

```
$ yarn om g src/lib/Scenes/Artwork/ArtworkMetadata
   create src/lib/Scenes/Artwork/ArtworkMetadata.tsx
   create src/lib/Scenes/Artwork/__tests__/ArtworkMetadata.test.tsx
```

```tsx
import React from "react"

export interface ArtworkMetadataProps {}

export const ArtworkMetadata: React.SFC<ArtworkMetadataProps> = props => {
  return null
}
```

```tsx
import { mount } from "enzyme"
import React from "react"
import { ArtworkMetadata } from "../ArtworkMetadata"

describe("ArtworkMetadata", () => {
  it("renders", () => {
    const wrapper = mount(<ArtworkMetadata />)
    expect(
      wrapper
        .find("ArtworkMetadata")
        .children()
        .getElements().length,
    ).not.toEqual(0)
  })
})
```

#### Relay Fragment Container

```
$ yarn om g src/lib/Scenes/Artwork/ArtworkMetadata --fragmentContainer Artwork
   create src/lib/Scenes/Artwork/ArtworkMetadata.tsx
   create src/lib/Scenes/Artwork/__tests__/ArtworkMetadata.test.tsx
```

```tsx
import React from "react"
import { createFragmentContainer, graphql } from "react-relay"
import { ArtworkMetadata_artwork } from "__generated__/ArtworkMetadata_artwork.graphql"

export interface ArtworkMetadataProps {
  artwork: ArtworkMetadata_artwork
}

export const ArtworkMetadata: React.SFC<ArtworkMetadataProps> = props => {
  return null
}

export const ArtworkMetadataFragmentContainer = createFragmentContainer(
  ArtworkMetadata,
  {
    artwork: graphql`
      fragment ArtworkMetadata_artwork on Artwork {
        # TODO: Remove this comment.
        #
        # Most, but not all, types have this field. Relay will automatically select it, so if you need a unique ID field
        # for e.g. React 'key' purposes, use this. Otherwise you can safely remove the selection.
        __id
      }
    `,
  },
)
```

```tsx
import { mount } from "enzyme"
import React from "react"
import { graphql } from "react-relay"
import { MockBoot, renderRelayTree } from "DevTools"
import { ArtworkMetadataFragmentContainer as ArtworkMetadata } from "../ArtworkMetadata"

jest.unmock("react-relay")

describe("ArtworkMetadata", () => {
  it("renders", async () => {
    const wrapper = await renderRelayTree({
      Component: ArtworkMetadata,
      query: graphql`
        # TODO: Add parameters or nest the fragment spread inside a root field, as necessary.
        query ArtworkMetadataTestQuery {
          ...ArtworkMetadata_artwork
        }
      `,
      mockResolvers: {},
      variables: {},
      wrapper: children => <MockBoot breakpoint="lg">{children}</MockBoot>,
    })
    expect(
      wrapper
        .find("ArtworkMetadata")
        .children()
        .getElements().length,
    ).not.toEqual(0)
  })
})
```

#### Relay Refetch Container

```
$ yarn om g src/lib/Scenes/Artwork/ArtworkMetadata --refetchContainer Artwork
   create src/lib/Scenes/Artwork/ArtworkMetadata.tsx
   create src/lib/Scenes/Artwork/__tests__/ArtworkMetadata.test.tsx
```

```tsx
import React from "react"
import { createRefetchContainer, graphql } from "react-relay"
import { ArtworkMetadata_artwork } from "__generated__/ArtworkMetadata_artwork.graphql"

export interface ArtworkMetadataProps {
  artwork: ArtworkMetadata_artwork
}

export const ArtworkMetadata: React.SFC<ArtworkMetadataProps> = props => {
  return null
}

export const ArtworkMetadataRefetchContainer = createRefetchContainer(
  ArtworkMetadata,
  {
    artwork: graphql`
      fragment ArtworkMetadata_artwork on Artwork {
        # TODO: Remove this comment.
        #
        # Most, but not all, types have this field. Relay will automatically select it, so if you need a unique ID field
        # for e.g. React 'key' purposes, use this. Otherwise you can safely remove the selection.
        #
        # In the unlikely case your type does not have this field, replace it with a different identifier field and be
        # sure to adjust the query below accordingly.
        __id
      }
    `,
  },
  graphql`
    query ArtworkMetadataRefetchQuery($nodeID: ID!) {
      node(__id: $nodeID) {
        ...ArtworkMetadata_artwork
      }
    }
  `,
)
```

```tsx
import { mount } from "enzyme"
import React from "react"
import { graphql } from "react-relay"
import { MockBoot, renderRelayTree } from "DevTools"
import { ArtworkMetadataRefetchContainer as ArtworkMetadata } from "../ArtworkMetadata"

jest.unmock("react-relay")

describe("ArtworkMetadata", () => {
  it("renders", async () => {
    const wrapper = await renderRelayTree({
      Component: ArtworkMetadata,
      query: graphql`
        # TODO: Add parameters or nest the fragment spread inside a root field, as necessary.
        query ArtworkMetadataTestQuery {
          ...ArtworkMetadata_artwork
        }
      `,
      mockResolvers: {},
      variables: {},
      wrapper: children => <MockBoot breakpoint="lg">{children}</MockBoot>,
    })
    expect(
      wrapper
        .find("ArtworkMetadata")
        .children()
        .getElements().length,
    ).not.toEqual(0)
  })
})
```

#### Relay Pagination Container

```
$ yarn om g src/lib/Scenes/Artwork/ArtworkMetadata --paginationContainer Artwork.artists
   create src/lib/Scenes/Artwork/ArtworkMetadata.tsx
   create src/lib/Scenes/Artwork/__tests__/ArtworkMetadata.test.tsx
```

```tsx
import React from "react"
import { createPaginationContainer, graphql } from "react-relay"
import { ArtworkMetadata_artwork } from "__generated__/ArtworkMetadata_artwork.graphql"

export interface ArtworkMetadataProps {
  artwork: ArtworkMetadata_artwork
}

export const ArtworkMetadata: React.SFC<ArtworkMetadataProps> = props => {
  return null
}

export const ArtworkMetadataPaginationContainer = createPaginationContainer(
  ArtworkMetadata,
  {
    artwork: graphql`
      fragment ArtworkMetadata_artwork on Artwork
        @argumentDefinitions(
          count: { type: "Int", defaultValue: 10 }
          cursor: { type: "String", defaultValue: "" }
        ) {
        # TODO: Remove this comment.
        #
        # Most, but not all, types have this field. Relay will automatically select it, so if you need a unique ID field
        # for e.g. React 'key' purposes, use this. Otherwise you can safely remove the selection.
        #
        # In the unlikely case your type does not have this field, replace it with a different identifier field and be
        # sure to adjust the query below accordingly.
        __id
        artists(first: $count, after: $cursor)
          @connection(key: "ArtworkMetadata_artists") {
          pageInfo {
            hasNextPage
          }
          edges {
            node {
              # TODO: Remove this comment.
              #
              # This is where your field selections for the list go. As for this identifier field selection, follow the
              # above comment.
              __id
            }
          }
        }
      }
    `,
  },
  {
    direction: "forward",
    getConnectionFromProps(props) {
      return props.artwork.artists
    },
    getFragmentVariables(prevVars, totalCount) {
      return {
        ...prevVars,
        count: totalCount,
      }
    },
    getVariables(props, { count, cursor }, fragmentVariables) {
      return {
        // in most cases, for variables other than connection filters like
        // `first`, `after`, etc. you may want to use the previous values.
        ...fragmentVariables,
        count,
        cursor,
        nodeID: props.artwork.__id,
      }
    },
    query: graphql`
      query ArtworkMetadataPaginationQuery(
        $nodeID: ID!
        $count: Int!
        $cursor: String
      ) {
        node(__id: $nodeID) {
          ...ArtworkMetadata_artwork @arguments(count: $count, cursor: $cursor)
        }
      }
    `,
  },
)
```

```tsx
import { mount } from "enzyme"
import React from "react"
import { graphql } from "react-relay"
import { MockBoot, renderRelayTree } from "DevTools"
import { ArtworkMetadataPaginationContainer as ArtworkMetadata } from "../ArtworkMetadata"

jest.unmock("react-relay")

describe("ArtworkMetadata", () => {
  it("renders", async () => {
    const wrapper = await renderRelayTree({
      Component: ArtworkMetadata,
      query: graphql`
        # TODO: Add parameters or nest the fragment spread inside a root field, as necessary.
        query ArtworkMetadataTestQuery {
          ...ArtworkMetadata_artwork
        }
      `,
      mockResolvers: {},
      variables: {},
      wrapper: children => <MockBoot breakpoint="lg">{children}</MockBoot>,
    })
    expect(
      wrapper
        .find("ArtworkMetadata")
        .children()
        .getElements().length,
    ).not.toEqual(0)
  })
})
```

[renderrelaytree]: https://github.com/artsy/reaction/blob/master/src/DevTools/renderRelayTree.tsx
