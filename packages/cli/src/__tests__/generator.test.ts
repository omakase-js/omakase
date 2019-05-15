import { execFileSync } from "child_process"
import * as dedent from "dedent"
import * as fs from "fs"
import * as path from "path"
import {
  ArrowFunction,
  AwaitExpression,
  BodyableNodeStructure,
  CallExpression,
  ExpressionStatement,
  JsxSelfClosingElement,
  MethodDeclaration,
  ObjectLiteralExpression,
  Project,
  PropertyAssignment,
  SourceFile,
  StringLiteral,
  SyntaxList,
  VariableStatement,
} from "ts-simple-ast"
import { run as runGenerator } from "yeoman-test"
import ComponentGenerator = require("../generator")

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

function generate(component: string, options = {}) {
  const context = runGenerator(path.join(__dirname, "../generator"))
    .withOptions(options)
    .withArguments([component])

  let error: Error
  context.on("ready", (generator: any) => {
    generator.env.on("error", (err: Error) => {
      error = err
    })
  })

  return context.then(() => {
    if (error) {
      throw error
    }
    const project = new Project({})
    const sourceFile = project.addExistingSourceFile(
      ComponentGenerator.sourceFilePath(component),
    )
    const testFile = project.addExistingSourceFile(
      ComponentGenerator.testFilePath(component),
    )
    return { sourceFile, testFile }
  })
}

describe("component generator", () => {
  let compiledGenerator: string
  let sourceFile: SourceFile
  let testFile: SourceFile

  const describeExpression = () =>
    (testFile
      .getFirstChildOrThrow()
      .getLastChildOrThrow() as ExpressionStatement).getExpression() as CallExpression

  const testBodySyntaxList = () => {
    const itExpression = ((describeExpression().getArguments()[1] as ArrowFunction)
      .getBody()
      .getChildSyntaxListOrThrow()
      .getFirstChildOrThrow() as ExpressionStatement).getExpression() as CallExpression
    return (itExpression.getArguments()[1] as ArrowFunction)
      .getBody()
      .getChildSyntaxListOrThrow()
  }

  beforeAll(() => {
    compiledGenerator = compileGenerator()
    expect.hasAssertions()
  })

  afterAll(() => {
    fs.unlinkSync(compiledGenerator)
  })

  describe("concerning the specified destination", () => {
    it("generates the component and test at the specified location", async () => {
      ;({ sourceFile, testFile } = await generate(
        "some/path/to/ArtworkBrickMetadata",
      ))
      expect(sourceFile).not.toBeNull()
      expect(testFile).not.toBeNull()
    })

    it("ignores a specified file extension", () => {
      expect(
        ComponentGenerator.sourceFilePath(
          `some/path/to/ArtworkBrickMetadata.tsx`,
        ),
      ).toEqual(`some/path/to/ArtworkBrickMetadata.tsx`)
      expect(
        ComponentGenerator.testFilePath(
          `some/path/to/ArtworkBrickMetadata.tsx`,
        ),
      ).toEqual(`some/path/to/__tests__/ArtworkBrickMetadata.test.tsx`)
    })
  })

  const describeTestFile = ({
    namedImport,
    extraTests,
  }: {
    namedImport: string
    extraTests: () => void
  }) => {
    describe("concerning the corresponding test file", () => {
      it("imports react", () => {
        expect(
          testFile
            .getImportDeclarationOrThrow("react")
            .getDefaultImportOrThrow()
            .getText(),
        ).toEqual("React")
      })

      it("imports from the implementation file", () => {
        expect(
          testFile
            .getImportDeclarationOrThrow("../ArtworkBrickMetadata")
            .getNamedImports()
            .map(ni => ni.getText()),
        ).toEqual([namedImport])
      })

      it("is named after the component", () => {
        const desc = describeExpression()
        expect(desc.getExpression().getText()).toEqual("describe")
        expect(
          (desc.getArguments()[0] as StringLiteral).getLiteralText(),
        ).toEqual("ArtworkBrickMetadata")
      })

      it("tests that the component renders anything", () => {
        expect(
          dedent(
            ((testBodySyntaxList().getLastChildOrThrow() as ExpressionStatement).getExpression() as CallExpression).getText(),
          ),
        ).toEqual(
          dedent(`
            expect(
              wrapper
                .find("ArtworkBrickMetadata")
                .children()
                .getElements().length
            ).not.toEqual(0)
        `),
        )
      })

      extraTests()
    })
  }

  describe("concerning purely a React component", () => {
    beforeAll(async () => {
      ;({ sourceFile, testFile } = await generate("ArtworkBrickMetadata"))
    })

    describeTestFile({
      namedImport: "ArtworkBrickMetadata",
      extraTests: () => {
        it("has a failing example test", () => {
          const mountExpression = (testBodySyntaxList().getFirstChildOrThrow() as VariableStatement)
            .getDeclarations()[0]
            .getInitializerOrThrow() as CallExpression

          expect(mountExpression.getExpression().getText()).toEqual("mount")
          expect(
            (mountExpression.getArguments()[0] as JsxSelfClosingElement)
              .getTagNameNode()
              .getText(),
          ).toEqual("ArtworkBrickMetadata")
        })
      },
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
      ;({ sourceFile } = await generate("ArtworkBrickMetadata", {
        classBased: true,
      }))
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
    const containerDeclaration = (containerType: string) =>
      sourceFile.getVariableDeclarationOrThrow(
        "ArtworkBrickMetadata" + containerType,
      )

    const createContainerCallExpression = (containerType: string) =>
      containerDeclaration(
        containerType,
      ).getLastChildOrThrow() as CallExpression

    const describeContainerType = (containerType: string) => {
      describeTestFile({
        namedImport: `ArtworkBrickMetadata${containerType} as ArtworkBrickMetadata`,
        extraTests: () => {
          it("imports react-relay", () => {
            expect(
              testFile
                .getImportDeclarationOrThrow("react-relay")
                .getNamedImports()
                .map(ni => ni.getText()),
            ).toEqual(["graphql"])
          })

          it("has a failing example test", () => {
            const mountExpression = ((testBodySyntaxList().getFirstChildOrThrow() as VariableStatement)
              .getDeclarations()[0]
              .getInitializerOrThrow() as AwaitExpression).getExpression() as CallExpression

            expect(mountExpression.getExpression().getText()).toEqual(
              "renderRelayTree",
            )

            const config = mountExpression.getArguments()[0] as ObjectLiteralExpression
            expect(
              (config.getPropertyOrThrow("Component") as PropertyAssignment)
                .getInitializerOrThrow()
                .getText(),
            ).toEqual("ArtworkBrickMetadata")
            expect(
              dedent(
                (config.getPropertyOrThrow("query") as PropertyAssignment)
                  .getInitializerOrThrow()
                  .getText(),
              ),
            ).toEqual(
              dedent(
                `graphql\`
                # TODO: Add parameters or nest the fragment spread inside a root field, as necessary.
                query ArtworkBrickMetadata_Test_Query {
                  ...ArtworkBrickMetadata_artwork
                }
              \``,
              ),
            )
          })
        },
      })

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
        expect(
          sourceFile
            .getExportedDeclarations()
            .includes(containerDeclaration(containerType)),
        ).toBeTruthy()
      })
    }

    describe("fragment containers", () => {
      beforeAll(async () => {
        ;({ sourceFile, testFile } = await generate("ArtworkBrickMetadata", {
          fragmentContainer: "Artwork",
        }))
      })

      describeContainerType("FragmentContainer")

      it("has the correct configuration", () => {
        const args = createContainerCallExpression(
          "FragmentContainer",
        ).getArguments()
        expect(args[0].getText()).toEqual("ArtworkBrickMetadata")
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
        ;({ sourceFile, testFile } = await generate("ArtworkBrickMetadata", {
          refetchContainer: "Artwork",
        }))
      })

      describeContainerType("RefetchContainer")

      it("has the correct configuration", () => {
        const args = createContainerCallExpression(
          "RefetchContainer",
        ).getArguments()
        expect(args[0].getText()).toEqual("ArtworkBrickMetadata")
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
        ;({ sourceFile, testFile } = await generate("ArtworkBrickMetadata", {
          paginationContainer: "Artwork.relatedArtworks",
        }))
      })

      it("fails if no paginated field is given", async () => {
        try {
          await generate("ArtworkBrickMetadata", {
            paginationContainer: "Artwork",
          })
        } catch (e) {
          expect(e.message).toMatch(/GraphQLType\.field/)
        }
      })

      describeContainerType("PaginationContainer")

      it("has the correct configuration", () => {
        const args = createContainerCallExpression(
          "PaginationContainer",
        ).getArguments()
        expect(args[0].getText()).toEqual("ArtworkBrickMetadata")
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
