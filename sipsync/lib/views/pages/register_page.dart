import 'package:flutter/material.dart';
import 'package:sipsync/views/pages/login_page.dart';
import 'package:sipsync/views/widgets/hero_widget.dart';

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

              FilledButton(
                onPressed: () {
                  Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) {
                          return LoginPage(title: 'Login');
                        },
                      ),
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
