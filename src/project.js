export class Project {
  static name = "Xmui";
  static version = "1.0.0";
  static basePath = process.cwd();
  static packagesPath = `${Project.basePath}/packages`;
  static srcPath = `${Project.basePath}/src`;
  static distPath = `${Project.basePath}/dist`;
  static serverPath = `${Project.packagesPath}/server`;
  static appPath = `${Project.packagesPath}/app`;
  static publicPath = `${Project.appPath}/public`;
  static getInfo() {
    return `Project: ${Project.name}, Version: ${Project.version}`;
  }
}
