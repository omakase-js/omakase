import { execFileSync, execSync } from "child_process"
import * as dedent from "dedent"
import * as fs from "fs"
import * as path from "path"
import {
  BodyableNodeStructure,
  CallExpression,
  MethodDeclaration,
  ObjectLiteralExpression,
  Project,
  PropertyAssignment,
  SourceFile,
  StringLiteral,
} from "ts-simple-ast"
import { run as runGenerator } from "yeoman-test"

function compileGenerator() {
  try {
    execFileSync(
      process.argv[0],
      [
        path.resolve(__dirname, "../../../../node_modules/.bin/tsc"),
        "--target",
        "es6",
        "--module",
        "commonjs",
        path.join(__dirname, "../generator/index.ts"),
      ],
      { env: process.env },
    )
  } catch (_) {
    // no-op, the error thrown is type errors, which we don’t care about here.
  }
  return path.join(__dirname, "../generator/index.js")
}

async function generate(component: string, options = {}) {
  await runGenerator(path.join(__dirname, "../generator"))
    .withOptions(options)
    .withArguments([component])
  const project = new Project({})
  return project.addExistingSourceFile(component + ".tsx")
}

describe("component generator", () => {
  let compiledGenerator: string
  let sourceFile: SourceFile

  beforeAll(() => {
    compiledGenerator = compileGenerator()
    expect.hasAssertions()
  })

  afterAll(() => {
    fs.unlinkSync(compiledGenerator)
  })

  describe("concerning purely a React component", () => {
    beforeAll(async () => {
      sourceFile = await generate("ArtworkBrickMetadata")
    })

    it("imports only react", () => {
      expect(
        sourceFile
          .getImportDeclarationOrThrow("react")
          .getDefaultImportOrThrow()
          .getText(),
      ).toEqual("React")
      expect(sourceFile.getImportDeclaration("react-relay")).toBeUndefined()
    })

    it("exports a props interface", () => {
      const iface = sourceFile.getInterfaceOrThrow("ArtworkBrickMetadataProps")
      expect(sourceFile.getExportedDeclarations().includes(iface)).toBeTruthy()
    })

    it("exports a SFC by default", () => {
      const componentDeclaration = sourceFile.getVariableDeclarationOrThrow(
        "ArtworkBrickMetadata",
      )
      expect(
        sourceFile.getExportedDeclarations().includes(componentDeclaration),
      ).toBeTruthy()
      expect(componentDeclaration.getTypeNodeOrThrow().getText()).toEqual(
        "React.SFC<ArtworkBrickMetadataProps>",
      )
    })

    it("exports a class based component on request", async () => {
      sourceFile = await generate("ArtworkBrickMetadata", {
        classBased: true,
      })
      const component = sourceFile.getClassOrThrow("ArtworkBrickMetadata")
      expect(
        sourceFile.getExportedDeclarations().includes(component),
      ).toBeTruthy()
      expect(component.getExtendsOrThrow().getText()).toEqual(
        "React.Component<ArtworkBrickMetadataProps>",
      )
    })
  })

  describe("concerning Relay", () => {
    const sharedTests = (
      containerType: string,
      containerTest: (callExpression: CallExpression) => void,
    ) => {
      it("imports react-relay", () => {
        expect(
          sourceFile
            .getImportDeclarationOrThrow("react-relay")
            .getNamedImports()
            .map(ni => ni.getText()),
        ).toEqual(["create" + containerType, "graphql"])
      })

      it("imports the generated type", () => {
        expect(
          sourceFile
            .getImportDeclarationOrThrow(
              "__generated__/ArtworkBrickMetadata_artwork.graphql",
            )
            .getNamedImports()
            .map(ni => ni.getText()),
        ).toEqual(["ArtworkBrickMetadata_artwork"])
      })

      it("adds the generated type to the props interface", () => {
        const iface = sourceFile.getInterfaceOrThrow(
          "ArtworkBrickMetadataProps",
        )
        expect(
          iface
            .getPropertyOrThrow("artwork")
            .getTypeNodeOrThrow()
            .getText(),
        ).toEqual("ArtworkBrickMetadata_artwork")
      })

      it("exports the container", () => {
        const containerDeclaration = sourceFile.getVariableDeclarationOrThrow(
          "ArtworkBrickMetadata" + containerType,
        )
        expect(
          sourceFile.getExportedDeclarations().includes(containerDeclaration),
        ).toBeTruthy()
        const createContainerCallExpression = containerDeclaration.getLastChildOrThrow() as CallExpression
        const args = createContainerCallExpression.getArguments()
        expect(args[0].getText()).toEqual("ArtworkBrickMetadata")
        containerTest(createContainerCallExpression)
      })
    }

    describe("fragment containers", () => {
      beforeAll(async () => {
        sourceFile = await generate("ArtworkBrickMetadata", {
          fragmentContainer: "Artwork",
        })
      })

      sharedTests("FragmentContainer", createContainerCallExpression => {
        const args = createContainerCallExpression.getArguments()
        expect(dedent(args[1].getText())).toEqual(
          dedent(
            `graphql\`
            fragment ArtworkBrickMetadata_artwork on Artwork {
            }
          \``,
          ),
        )
      })
    })

    describe("refetch containers", () => {
      beforeAll(async () => {
        sourceFile = await generate("ArtworkBrickMetadata", {
          refetchContainer: "Artwork",
        })
      })

      sharedTests("RefetchContainer", createContainerCallExpression => {
        const args = createContainerCallExpression.getArguments()
        expect(dedent(args[1].getText())).toEqual(
          dedent(
            `graphql\`
            fragment ArtworkBrickMetadata_artwork on Artwork {
              # Most, but not all, types have this field. If needed, replace it with a
              # different identifier field and be sure to adjust the query below
              # accordingly. (Also be sure to remove this comment.)
              __id
            }
          \``,
          ),
        )
        expect(dedent(args[2].getText())).toEqual(
          dedent(
            `graphql\`
            query ArtworkBrickMetadataRefetchQuery($nodeID: ID!) {
              node(__id: $nodeID) {
                ...ArtworkBrickMetadata_artwork
              }
            }
          \``,
          ),
        )
      })
    })

    describe("pagination containers", () => {
      beforeAll(async () => {
        sourceFile = await generate("ArtworkBrickMetadata", {
          paginationContainer: "Artwork.relatedArtworks",
        })
      })

      sharedTests("PaginationContainer", createContainerCallExpression => {
        const args = createContainerCallExpression.getArguments()
        expect(dedent(args[1].getText())).toEqual(
          dedent(
            `graphql\`
            fragment ArtworkBrickMetadata_artwork on Artwork @argumentDefinitions(count: { type: "Int", defaultValue: 10 }, cursor: { type: "String", defaultValue: "" }) {
              # Most, but not all, types have this field. If needed, replace it with a
              # different identifier field and be sure to adjust the query below
              # accordingly. (Also be sure to remove this comment.)
              __id
              relatedArtworks(first: $count, after: $cursor) @connection(key: "ArtworkBrickMetadata_relatedArtworks") {
                pageInfo {
                  hasNextPage
                }
                edges {
                  node {
                  }
                }
              }
            }
          \``,
          ),
        )
        const options = args[2] as ObjectLiteralExpression
        expect(
          ((options.getPropertyOrThrow(
            "direction",
          ) as PropertyAssignment).getInitializerOrThrow() as StringLiteral).getLiteralText(),
        ).toEqual("forward")
        expect(
          ((options.getPropertyOrThrow(
            "getConnectionFromProps",
          ) as MethodDeclaration).getStructure() as BodyableNodeStructure)
            .bodyText,
        ).toEqual("return props.artwork.relatedArtworks")
        expect(options.getPropertyOrThrow("getVariables").getText()).toMatch(
          "nodeID: props.artwork.__id",
        )
        expect(
          dedent(
            (options.getPropertyOrThrow("query") as PropertyAssignment)
              .getInitializerOrThrow()
              .getText(),
          ),
        ).toEqual(
          dedent(
            `graphql\`
            query ArtworkBrickMetadataPaginationQuery(
              $nodeID: ID!
              $count: Int!
              $cursor: String
            ) {
              node(__id: $nodeID) {
                ...ArtworkBrickMetadata_artwork @arguments(count: $count, cursor: $cursor)
              }
            }
          \``,
          ),
        )
      })
    })
  })
})
