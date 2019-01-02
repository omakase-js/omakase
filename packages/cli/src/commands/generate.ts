import { Command, flags as f } from "@oclif/command"
import * as yeoman from "yeoman-environment"
import ComponentGenerator = require("../generator")

export default class Generate extends Command {
  static aliases = ["g"]

  static description = "Template for your React/Relay component"

  static examples = [
    `$ om generate path/to/MyComponent`,
    `$ om generate MyComponent --classBased`,
    `$ om generate MyComponent --fragmentContainer Artist`,
    `$ om generate MyComponent --paginationContainer Artist.artworks`,
    `$ om g MyComponent -f Artist`,
  ]

  static flags = {
    help: f.help({ char: "h" }),
    fragmentContainer: f.string({
      char: "f",
      description: "name of the type on which to create a fragment",
      helpValue: "GraphQLType",
    }),
    refetchContainer: f.string({
      char: "r",
      description: "name of the type on which to create a fragment",
      helpValue: "GraphQLType",
    }),
    paginationContainer: f.string({
      char: "p",
      description:
        "name of the type on which to create a fragment and the field to paginate",
      helpValue: "GraphQLType.field",
    }),
    classBased: f.boolean({
      char: "c",
      description:
        "create a class based component, instead of the default function",
      default: false,
    }),
  }

  static args = [{ name: "Component", required: true }]

  async run() {
    const { args, flags } = this.parse(Generate)
    const env = yeoman.createEnv()

    env.on("error", (err: Error) => {
      this.error(err.message)
    })

    env
      .instantiate(ComponentGenerator, {
        options: flags,
        arguments: [args.Component],
      })
      .run()
  }
}
