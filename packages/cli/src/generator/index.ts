const Generator = require("yeoman-generator")

class ComponentGenerator extends Generator {
  constructor(args: any, opts: any) {
    super(args, opts)

    this.argument("Component", { type: String, required: true })
    this.option("classBased", { type: Boolean, default: false })
    this.option("fragmentContainer", { type: String })
    this.option("refetchContainer", { type: String })
    this.option("paginationContainer", { type: String })
  }

  writing() {
    const {
      Component,
      classBased,
      fragmentContainer,
      refetchContainer,
      paginationContainer,
    } = this.options

    // TODO: Handle case where Component is a path
    const ComponentName = Component
    const GraphQLTypeName =
      fragmentContainer ||
      refetchContainer ||
      (paginationContainer && paginationContainer.split(".")[0])
    const paginationFieldName =
      paginationContainer && paginationContainer.split(".")[1]
    const relayPropName =
      GraphQLTypeName &&
      GraphQLTypeName[0].toLowerCase() + GraphQLTypeName.substr(1)
    const relayTypeName = relayPropName && ComponentName + "_" + relayPropName
    const relayContainerType =
      GraphQLTypeName && fragmentContainer
        ? "FragmentContainer"
        : refetchContainer
          ? "RefetchContainer"
          : "PaginationContainer"

    this.fs.copyTpl(
      this.templatePath("Component.tsx.ejs"),
      this.destinationPath(Component + ".tsx"),
      {
        ComponentName,
        classBased,
        GraphQLTypeName,
        relayContainerType,
        relayPropName,
        relayTypeName,
        fragmentContainer,
        refetchContainer,
        paginationContainer,
        paginationFieldName,
      },
    )
  }
}

module.exports = ComponentGenerator
