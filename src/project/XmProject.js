export class XmProject {
  static name = "Xmui";
  static version = "1.0.0";
  static basePath = process.cwd();
  static packagesPath = `${XmProject.basePath}/packages`;
  static srcPath = `${XmProject.basePath}/src`;
  static distPath = `${XmProject.basePath}/dist`;
  static serverPath = `${XmProject.packagesPath}/server`;
  static appPath = `${XmProject.packagesPath}/app`;
  static getInfo() {
    return `XmProject: ${XmProject.name}, Version: ${XmProject.version}`;
  }
}
