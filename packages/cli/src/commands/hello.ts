import {Command, flags as f} from "@oclif/command"

export default class Hello extends Command {
  static description = "describe the command here"

  static examples = [
    `$ om hello
hello world from ./src/hello.ts!
`,
  ]

  static flags = {
    help: f.help({char: "h"}),
    // flag with a value (-n, --name=VALUE)
    name: f.string({char: "n", description: "name to print"}),
    // flag with no value (-f, --force)
    force: f.boolean({char: "f"}),
  }

  static args = [{name: "file"}]

  async run() {
    const {args, flags} = this.parse(Hello)

    const name = flags.name || "world"
    this.log(`hello ${name} from ./src/commands/hello.ts`)
    if (args.file && flags.force) {
      this.log(`you input --force and --file: ${args.file}`)
    }
  }
}
