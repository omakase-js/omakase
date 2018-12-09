import * as Generator from "yeoman-generator"

export class ComponentGenerator extends Generator {
  constructor(args: any, opts: any) {
    super(args, opts)

    this.argument("Component", { type: String, required: true })
    this.option("classBased", { type: Boolean, default: false })
    this.option("fragmentContainer", { type: String })
    this.option("refetchContainer", { type: String })
    this.option("paginationContainer", { type: String })
  }

  writing() {
    // NOOP
    console.log("Hiiiii")
  }
}
