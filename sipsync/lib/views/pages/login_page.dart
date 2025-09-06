import 'package:flutter/material.dart';
import 'package:sipsync/views/pages/register_page.dart';
import 'package:sipsync/views/pages/welcome_page.dart';
import 'package:sipsync/views/widget_tree.dart';
import 'package:sipsync/views/widgets/hero_widget.dart';
import 'package:sipsync/views/widgets/square_widget.dart';
import 'package:sipsync/views/widgets/texfield_widget.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key, required this.title});

  final String title;

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  TextEditingController controllerEmail = TextEditingController();
  TextEditingController controllerPassword = TextEditingController();
  String confirmEmail = 'abc';
  String confirmPassword = '123';

  @override
  void dispose() {
    controllerEmail.dispose();
    controllerPassword.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: BackButton(
          onPressed: () {
            Navigator.pushAndRemoveUntil(
              context,
              MaterialPageRoute(
                builder: (context) {
                  return WelcomePage();
                },
              ),
              (route) => false,
            );
          },
        ),
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(25.0),
          child: Center(
            child: Column(
              children: [
                SizedBox(width: 400, child: HeroWidget(title: widget.title)),
                SizedBox(height: 15),

                //email
                TextFieldWidget(
                  hintText: 'Email',
                  controller: controllerEmail,
                  obscureText: false,
                ),
                //password
                TextFieldWidget(
                  hintText: 'Password',
                  controller: controllerPassword,
                  obscureText: true,
                ),
                //forgot password
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () {},
                    child: Text('Forgot Password?'),
                  ),
                ),
                SizedBox(height: 10),
                //login button
                FilledButton(
                  onPressed: () {
                    onLoginPressed();
                  },
                  style: ElevatedButton.styleFrom(
                    minimumSize: Size(double.infinity, 50),
                  ),
                  child: Text(widget.title),
                ),
                SizedBox(height: 50),
                Row(
                  children: [
                    Expanded(child: Divider(thickness: 1.5)),
                    Text(
                      'Or continue with',
                      style: TextStyle(
                        color: const Color.fromARGB(255, 117, 117, 117),
                      ),
                    ),
                    Expanded(child: Divider(thickness: 1.5)),
                  ],
                ),
                SizedBox(height: 70),

                //other login options
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SquareWidget(imagePath: 'assets/images/google.png'),
                    SizedBox(width: 50),
                    SquareWidget(imagePath: 'assets/images/apple.png'),
                  ],
                ),
                SizedBox(height: 65),
                //sign up option
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('Don\'t have an account?'),
                    TextButton(
                      onPressed: () {
                        Navigator.pushAndRemoveUntil(
                          context,
                          MaterialPageRoute(
                            builder: (context) {
                              return RegisterPage();
                            },
                          ),
                          (route) => false,
                        );
                      },
                      child: Text('Sign Up'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void onLoginPressed() {
    if (confirmEmail == controllerEmail.text &&
        confirmPassword == controllerPassword.text) {
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(
          builder: (context) {
            return WidgetTree();
          },
        ),
        (route) => false,
      );
    }
  }
}
