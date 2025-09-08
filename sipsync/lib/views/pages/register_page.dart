import 'package:flutter/material.dart';
import 'package:sipsync/views/pages/login_page.dart';
import 'package:sipsync/views/pages/welcome_page.dart';
import 'package:sipsync/views/widgets/hero_widget.dart';
import 'package:sipsync/views/widgets/texfield_widget.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();
  final _ageController = TextEditingController();
  final _heightController = TextEditingController();
  final _weightController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _nameController.dispose();
    _ageController.dispose();
    _heightController.dispose();
    _weightController.dispose();
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
          child: Column(
            children: [
              SizedBox(width: 400, child: HeroWidget(title: 'Create account')),
              SizedBox(height: 15),
              TextFieldWidget(
                hintText: 'Name/username',
                controller: _nameController,
                obscureText: false,
                dis: 10,
              ),
              TextFieldWidget(
                hintText: 'Insert your age',
                controller: _ageController,
                obscureText: false,
                dis: 10,
              ),
              TextFieldWidget(
                hintText: 'Insert your height',
                controller: _heightController,
                obscureText: false,
                dis: 10,
              ),
              TextFieldWidget(
                hintText: 'Insert your weight',
                controller: _weightController,
                obscureText: false,
                dis: 10,
              ),
              TextFieldWidget(
                hintText: 'Insert your Email',
                controller: _emailController,
                obscureText: false,
                dis: 10,
              ),
              TextFieldWidget(
                hintText: 'Insert your Password',
                controller: _passwordController,
                obscureText: true,
                dis: 10,
              ),
              FilledButton(
                onPressed: () {
                  Navigator.pushAndRemoveUntil(
                    context,
                    MaterialPageRoute(
                      builder: (context) {
                        return LoginPage(title: 'Login');
                      },
                    ),
                    (route) => false,
                  );
                },
                style: ElevatedButton.styleFrom(
                  minimumSize: Size(double.infinity, 50),
                ),
                child: Text('Register'),
              ),
              SizedBox(height: 60),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('Already have an account?'),
                  TextButton(
                    onPressed: () {
                      Navigator.pushAndRemoveUntil(
                        context,
                        MaterialPageRoute(
                          builder: (context) {
                            return LoginPage(title: 'Login');
                          },
                        ),
                        (route) => false,
                      );
                    },
                    child: Text('Sign In'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
