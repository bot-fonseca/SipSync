import 'package:flutter/material.dart';
import 'package:sipsync/views/pages/login_page.dart';
import 'package:sipsync/views/widgets/hero_widget.dart';
import 'package:sipsync/views/widgets/texfield_widget.dart';

class RegisterPage extends StatelessWidget {
  const RegisterPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(25.0),
          child: Column(
            children: [
              SizedBox(width: 400, child: HeroWidget(title: 'Create account')),
              SizedBox(height: 15),
              TextFieldWidget(hintText: 'Name/username', obscureText: false),
              TextFieldWidget(hintText: 'Insert your age', obscureText: false),
              TextFieldWidget(hintText: 'Insert your height', obscureText: false),
              TextFieldWidget(hintText: 'Insert your weight', obscureText: false),
              TextFieldWidget(hintText: 'Insert your Email', obscureText: false),
              TextFieldWidget(hintText: 'Insert your Password', obscureText: true),
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
            ],
          ),
        ),
      ),
    );
  }
}
