import { Command, flags as f } from "@oclif/command"
import * as yeoman from "yeoman-environment"
import { ComponentGenerator } from "../generator"

export default class Generate extends Command {
  static description = "templates for your react component"

  static examples = [
    `$ om generate hi
hello world from ./src/hello.ts!
`,
  ]

  static flags = {
    help: f.help({ char: "h" }),
    // flag with a value (-n, --name=VALUE)
    name: f.string({ char: "n", description: "name to print" }),
    // flag with no value (-f, --force)
    force: f.boolean({ char: "f" }),
  }

  static args = [{ name: "string" }]

  async run() {
    // const { args, flags } = this.parse(Generate)

    const env = yeoman.createEnv()
    // env.register(
    //   require.resolve("packages/cli/src/commands/generator/Example.ts"),
    //   "component-gen",
    // )
    // env.store.add("component-gen", modulePath)
    const a = env.instantiate(ComponentGenerator, {
      options: { classBased: true },
      arguments: ["my comp"],
    })
    a.run()
    // console.log(a)
    // env.run("component-gen", { "skip-install": true }, () => {
    //   // done
    //   console.log("---")
    // })
  }
}
