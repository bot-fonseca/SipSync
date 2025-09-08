import 'package:flutter/material.dart';
import 'package:sipsync/views/pages/login_page.dart';
import 'package:sipsync/views/widgets/hero_widget.dart';
import 'package:sipsync/views/widgets/texfield_widget.dart';

class ResetusernamePage extends StatelessWidget {
  const ResetusernamePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: BackButton(
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) {
                  return LoginPage(title: 'Login');
                },
              )
            );
          },
        ),
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(25.0),
          child: Column(
            children: [
              SizedBox(width: 400, child: HeroWidget(title: 'Forget Password?')),
              SizedBox(height: 15),
              TextFieldWidget(hintText: 'Insert your Email', obscureText: false, dis: 10),
              //butao
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
                child: Text('Change Password'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
