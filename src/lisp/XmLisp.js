export class LispError extends Error {
  constructor(message, { line = null, col = null, type = "Error" } = {}) {
    super(message);
    this.name = type;
    this.line = line;
    this.col = col;
  }

  toString() {
    let pos =
      this.line !== null ? ` at line ${this.line}, col ${this.col}` : "";
    return `${this.name}: ${this.message}${pos}`;
  }
}

export class XmLisp {
  static global = XmLisp.createGlobalEnv();

  // 分离内建函数模块
  static builtinsMath = {
    "+": (a, b) => a + b,
    "-": (a, b) => a - b,
    "*": (a, b) => a * b,
    "/": (a, b) => a / b,
    "=": (a, b) => a === b,
    ">": (a, b) => a > b,
    "<": (a, b) => a < b,
    max: (...args) => Math.max(...args),
    min: (...args) => Math.min(...args),
    sin: (x) => Math.sin(x),
    cos: (x) => Math.cos(x),
    tan: (x) => Math.tan(x),
  };

  static builtinsString = {
    "string-length": (s) => s.length,
    substring: (s, start, end) => s.substring(start, end),
    "string-append": (...args) => args.join(""),
  };

  static builtinsList = {
    cons: (a, b) => [a].concat(b),
    car: (lst) => lst[0],
    cdr: (lst) => lst.slice(1),
    list: (...args) => args,
  };

  static builtinsOther = {
    print: (...args) => console.log(...args),
  };

  static createBuiltinsEnv() {
    const env = Object.create(null);
    Object.assign(
      env,
      this.builtinsMath,
      this.builtinsString,
      this.builtinsList,
      this.builtinsOther,
      {
        if: true,
        begin: true,
        while: true,
        define: true,
        lambda: true,
        cond: true,
        let: true,
        "set!": true,
      }
    );
    return env;
  }

  static createGlobalEnv(parent = null) {
    if (!parent) parent = this.createBuiltinsEnv();
    const env = Object.create(parent);
    return env;
  }

  // 支持简单的行列追踪（用于错误提示）
  static tokenize(code) {
    // 简单拆词，不支持复杂字符串多行等
    const tokens = [];
    let line = 1,
      col = 0;
    const rawTokens = code
      .replace(/\(/g, " ( ")
      .replace(/\)/g, " ) ")
      .trim()
      .split(/\s+/);

    for (const t of rawTokens) {
      tokens.push({ token: t, line, col });
      col += t.length + 1;
      if (t.includes("\n")) {
        line++;
        col = 0;
      }
    }
    return tokens;
  }

  // 解析带位置信息的tokens，返回AST树(去除位置简化eval输入)
  static parse(tokens) {
    if (tokens.length === 0)
      throw new LispError("Unexpected EOF", { type: "SyntaxError" });

    const { token, line, col } = tokens.shift();
    if (token === "(") {
      const list = [];
      while (tokens[0] && tokens[0].token !== ")")
        list.push(this.parse(tokens));
      if (!tokens.length)
        throw new LispError("Expected ')'", { line, col, type: "SyntaxError" });
      tokens.shift(); // remove ')'
      return list;
    } else if (token === ")") {
      throw new LispError("Unexpected ')'", { line, col, type: "SyntaxError" });
    } else {
      return this.atom(token);
    }
  }

  static atom(token) {
    if (!isNaN(parseFloat(token))) return parseFloat(token);
    if (token === "true") return true;
    if (token === "false") return false;
    if (token.startsWith('"') && token.endsWith('"')) return token.slice(1, -1);
    return token;
  }
  static envHas(env, key) {
    return key in env;
  }
  // 拆分eval具体操作，提高可维护性
  static eval(ast, env = this.global) {
    if (typeof ast === "string") {
      if (!this.envHas(env, ast))
        throw new LispError(`Undefined symbol: ${ast}`, {
          type: "ReferenceError",
        });
      return env[ast];
    }

    if (typeof ast === "number" || typeof ast === "boolean") {
      return ast;
    }

    if (!Array.isArray(ast)) return ast;

    const [first, ...rest] = ast;

    // 语法控制流程分发
    switch (first) {
      case "define":
        return this.evalDefine(rest, env);
      case "lambda":
        return this.evalLambda(rest, env);
      case "if":
        return this.evalIf(rest, env);
      case "while":
        return this.evalWhile(rest, env);
      case "begin":
        return this.evalBegin(rest, env);
      case "cond":
        return this.evalCond(rest, env);
      case "let":
        return this.evalLet(rest, env);
      case "set!":
        return this.evalSet(rest, env);
      default:
        return this.evalCall(first, rest, env);
    }
  }

  static evalDefine([name, expr], env) {
    env[name] = this.eval(expr, env);
    return env[name];
  }

  static evalLambda([params, body], env) {
    return (...args) => {
      const localEnv = Object.create(env);
      for (let i = 0; i < params.length; i++) {
        localEnv[params[i]] = args[i];
      }
      return this.eval(body, localEnv);
    };
  }

  static evalIf([cond, thenVal, elseVal], env) {
    return this.eval(cond, env)
      ? this.eval(thenVal, env)
      : this.eval(elseVal, env);
  }

  static evalWhile([cond, body], env) {
    let result;
    while (this.eval(cond, env)) {
      result = this.eval(body, env);
    }
    return result;
  }

  static evalBegin(exprs, env) {
    let result;
    for (const expr of exprs) {
      result = this.eval(expr, env);
    }
    return result;
  }

  static evalCond(clauses, env) {
    for (const clause of clauses) {
      if (clause.length !== 2)
        throw new LispError("cond clause must be (test expr)", {
          type: "SyntaxError",
        });
      const [test, expr] = clause;
      if (this.eval(test, env)) return this.eval(expr, env);
    }
    return null;
  }

  static evalLet([bindings, body], env) {
    const localEnv = Object.create(env);
    for (const [name, expr] of bindings) {
      localEnv[name] = this.eval(expr, env);
    }
    return this.eval(body, localEnv);
  }

  static evalSet([name, expr], env) {
    if (!(name in env))
      throw new LispError(`Cannot set! undefined variable: ${name}`, {
        type: "ReferenceError",
      });
    env[name] = this.eval(expr, env);
    return env[name];
  }

  static evalCall(first, rest, env) {
    const fn = this.eval(first, env);
    if (typeof fn !== "function")
      throw new LispError(`${first} is not a function`, { type: "TypeError" });
    const args = rest.map((arg) => this.eval(arg, env));
    // 简单尾调用优化（检测lambda时返回函数，直接调用，无递归堆栈）
    return fn(...args);
  }

  static run(code, env = null) {
    const tokens = this.tokenize(code);
    const ast = this.parse(tokens);
    const context = env || this.global;
    return this.eval(ast, context);
  }

  // 支持异步示例（你可以用 async 函数代替 lambda）
  static async evalAsync(ast, env = this.global) {
    if (typeof ast === "string") {
      if (!this.envHas(env, ast))
        throw new LispError(`Undefined symbol: ${ast}`, {
          type: "ReferenceError",
        });
      return env[ast];
    }

    if (typeof ast === "number" || typeof ast === "boolean") {
      return ast;
    }

    if (!Array.isArray(ast)) return ast;

    const [first, ...rest] = ast;

    switch (first) {
      case "define": {
        const [name, expr] = rest;
        env[name] = await this.evalAsync(expr, env);
        return env[name];
      }

      case "lambda": {
        const [params, body] = rest;
        return async (...args) => {
          const localEnv = Object.create(env);
          for (let i = 0; i < params.length; i++) {
            localEnv[params[i]] = args[i];
          }
          return this.evalAsync(body, localEnv);
        };
      }

      case "if": {
        const [cond, thenVal, elseVal] = rest;
        return (await this.evalAsync(cond, env))
          ? this.evalAsync(thenVal, env)
          : this.evalAsync(elseVal, env);
      }

      case "while": {
        const [cond, body] = rest;
        let result;
        while (await this.evalAsync(cond, env)) {
          result = await this.evalAsync(body, env);
        }
        return result;
      }

      case "begin": {
        let result;
        for (const expr of rest) {
          result = await this.evalAsync(expr, env);
        }
        return result;
      }

      default: {
        const fn = await this.evalAsync(first, env);
        if (typeof fn !== "function")
          throw new LispError(`${first} is not a function`, {
            type: "TypeError",
          });
        const args = [];
        for (const arg of rest) {
          args.push(await this.evalAsync(arg, env));
        }
        return fn(...args);
      }
    }
  }

  // ────────────── JS AST 转 Lisp 树 ──────────────

  static fromJsAst(ast) {
    if (!ast || typeof ast !== "object") return ast;

    switch (ast.type) {
      case "BinaryExpression":
        return [
          ast.operator,
          this.fromJsAst(ast.left),
          this.fromJsAst(ast.right),
        ];

      case "CallExpression":
        const callee = this.fromJsAst(ast.callee);
        const args = ast.arguments.map((a) => this.fromJsAst(a));
        return [callee, ...args];

      case "Identifier":
        return ast.name;

      case "Literal":
        return ast.value;

      case "Program":
        return this.fromJsAst(ast.body[0]);

      case "ExpressionStatement":
        return this.fromJsAst(ast.expression);

      default:
        throw new LispError(`Unsupported AST node: ${ast.type}`, {
          type: "SyntaxError",
        });
    }
  }
}
