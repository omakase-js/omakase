import * as path from "path"
import * as Generator from "yeoman-generator"

class ComponentGenerator extends Generator {
  static sourceFilePath(component: string) {
    return `${component}.tsx`
  }

  static testFilePath(component: string) {
    return path.join(
      path.dirname(component),
      `__tests__/${path.basename(component)}.test.tsx`,
    )
  }

  constructor(args: any, opts: any) {
    super(args, opts)

    this.argument("component", { type: String, required: true })
    this.option("classBased", { type: Boolean, default: false })
    this.option("fragmentContainer", { type: String })
    this.option("refetchContainer", { type: String })
    this.option("paginationContainer", { type: String })
  }

  initializing() {
    if (
      this.options.paginationContainer &&
      !this.options.paginationContainer.includes(".")
    ) {
      this.env.error(
        new Error(
          "The `paginationContainer' option expects a value formatted like GraphQLType.field",
        ),
      )
    }
  }

  writing() {
    const {
      component,
      classBased,
      fragmentContainer,
      refetchContainer,
      paginationContainer,
    } = this.options as {
      component: string
      classBased: boolean
      fragmentContainer?: string
      refetchContainer?: string
      paginationContainer?: string
    }

    const componentName = path.basename(component)

    const graphqlTypeName =
      fragmentContainer ||
      refetchContainer ||
      (paginationContainer && paginationContainer.split(".")[0])

    const relayPaginationFieldName =
      paginationContainer && paginationContainer.split(".")[1]

    const relayPropName =
      graphqlTypeName &&
      graphqlTypeName[0].toLowerCase() + graphqlTypeName.substr(1)

    const relayTypeName = relayPropName && componentName + "_" + relayPropName

    const relayContainerType = !graphqlTypeName
      ? null
      : fragmentContainer
        ? "FragmentContainer"
        : refetchContainer
          ? "RefetchContainer"
          : "PaginationContainer"

    const relayContainerName =
      relayContainerType && componentName + relayContainerType

    // FIXME: For some unknown reason the sourceRoot is wrong when run from the CLI
    this.sourceRoot(path.join(__dirname, "templates"))

    this.fs.copyTpl(
      this.templatePath("Component.tsx.ejs"),
      this.destinationPath(ComponentGenerator.sourceFilePath(component)),
      {
        componentName,
        classBased,
        graphqlTypeName,
        relayContainerName,
        relayContainerType,
        relayPropName,
        relayTypeName,
        relayPaginationFieldName,
      },
    )
    this.fs.copyTpl(
      this.templatePath("Component.test.tsx.ejs"),
      this.destinationPath(ComponentGenerator.testFilePath(component)),
      {
        componentName,
        relayContainerName,
        relayContainerType,
        relayTypeName,
      },
    )
  }
}

// This is because the yeoman-test package expects an export like `module.exports = ComponentGenerator`
export = ComponentGenerator
